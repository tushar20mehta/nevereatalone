/**
 * Backup the entire users + dinners collections to a local JSON file
 * (workaround for Spark-tier projects without native Firestore export).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=~/secrets/nevereatalone-sa.json \
 *     node scripts/backup-firestore.mjs
 *
 * Optional:
 *   --output ~/mypath/backup.json   (override default output path)
 *
 * Default output:
 *   ~/secrets/nevereatalone-backup-<YYYY-MM-DD-HHMM>.json
 *
 * ⚠️  The output file contains sensitive user data (names, emails, full
 *     addresses). Keep it in ~/secrets/ or another private location —
 *     never inside the repo. `.gitignore` already blocks backup-*.json
 *     and nevereatalone-backup-*.json at the repo root as a safety net.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore'
import { writeFileSync, statSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { homedir } from 'node:os'

const PROJECT = 'nevereatalone-2'
const COLLECTIONS = ['users', 'dinners']

function parseArgs() {
  const args = process.argv.slice(2)
  let output = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1]
      i++
    }
  }
  return { output }
}

function defaultOutputPath() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
  return resolve(homedir(), 'secrets', `nevereatalone-backup-${stamp}.json`)
}

/**
 * Recursively convert Firestore values into plain JSON-safe objects.
 * - Timestamp → ISO string
 * - GeoPoint  → { _latitude, _longitude }
 * - DocumentReference → path string
 * - Date      → ISO string
 * - Arrays / objects: recurse
 */
function sanitize(value) {
  if (value === null || value === undefined) return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof GeoPoint) {
    return { _latitude: value.latitude, _longitude: value.longitude }
  }
  if (value instanceof DocumentReference) return value.path
  if (Array.isArray(value)) return value.map(sanitize)
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v)
    return out
  }
  return value
}

async function dumpCollection(db, name) {
  const snap = await db.collection(name).get()
  return snap.docs.map(doc => ({ id: doc.id, data: sanitize(doc.data()) }))
}

async function main() {
  const { output } = parseArgs()
  const outputPath = output ? resolve(output) : defaultOutputPath()

  console.log(`\n🔐 Firestore backup (Spark-tier workaround)`)
  console.log(`   project: ${PROJECT}`)
  console.log(`   collections: ${COLLECTIONS.join(', ')}`)
  console.log(`   output: ${outputPath}\n`)

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS is not set.')
    console.error('   Export it to point at your service account JSON:')
    console.error('   export GOOGLE_APPLICATION_CREDENTIALS=~/secrets/nevereatalone-sa.json')
    process.exit(1)
  }

  initializeApp({ credential: applicationDefault() })
  const db = getFirestore()

  const collections = {}
  for (const name of COLLECTIONS) {
    process.stdout.write(`   • fetching ${name}... `)
    collections[name] = await dumpCollection(db, name)
    console.log(`${collections[name].length} docs`)
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    project: PROJECT,
    collections
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8')

  const { size } = statSync(outputPath)
  const kb = (size / 1024).toFixed(1)

  console.log('\n📊 Summary')
  for (const name of COLLECTIONS) {
    console.log(`   ${name}: ${collections[name].length} docs`)
  }
  console.log(`   file:  ${outputPath}`)
  console.log(`   size:  ${kb} KB`)
  console.log('\n✅ Backup complete.\n')
}

main().catch(err => {
  console.error('\n❌ Backup failed:', err)
  process.exit(1)
})
