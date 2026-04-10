/**
 * One-time migration: split legacy user address into public (city/postalCode)
 * and private (street) fields.
 *
 * Background: Until this migration, each user doc had a single multi-line
 * `address` field (or even older `street`/`plz`/`city`/`location` fields).
 * We now store `city` + `postalCode` on the public user doc and move the
 * sensitive street/house number into `users/{uid}/private/address.street`,
 * which is gated by Firestore rules to be readable only by the owner.
 *
 * ----------------------------------------------------------------------
 * ⚠️  BEFORE running without --dry-run: take a Firestore export backup!
 *     gcloud firestore export gs://<your-bucket>/backups/$(date +%Y%m%d)
 *     (requires roles/datastore.importExportAdmin and a GCS bucket)
 * ----------------------------------------------------------------------
 *
 * Usage:
 *   # Authenticate with a service account key:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *
 *   # 1. Dry run — prints what WOULD change, writes nothing:
 *   node scripts/migrate-addresses.mjs --dry-run
 *
 *   # 2. Real run — writes changes. Only after a backup!
 *   node scripts/migrate-addresses.mjs
 *
 * Safety rules:
 * - Never overwrites a user that already has `city` + `postalCode` set.
 * - Only parses DE addresses with a simple "<streetLines>\n<PLZ> <City>"
 *   heuristic. Any non-DE country, or ambiguous DE string, is marked
 *   AMBIGUOUS: the full legacy string is stored as `private.address.street`,
 *   city/postalCode stay empty, and the user is prompted by the UI to
 *   re-enter them on next edit. Nothing is lost.
 * - Deletes the legacy top-level fields (`address`, `street`, `plz`,
 *   `location`) from the public doc after migration.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const DRY_RUN = process.argv.includes('--dry-run')

initializeApp({ credential: applicationDefault() })
const db = getFirestore()

/**
 * Parse a legacy DE address string into { postalCode, city, street }.
 * Returns { ambiguous: true } if the heuristic can't confidently split it.
 * Heuristic: last line must match /^(\d{4,5})\s+(.+)$/; everything above is street.
 */
function parseGermanAddress(raw) {
  if (!raw) return { ambiguous: true }
  const lines = String(raw).split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return { ambiguous: true }

  const lastLine = lines[lines.length - 1]
  const match = lastLine.match(/^(\d{4,5})\s+(.+)$/)
  if (!match) return { ambiguous: true }

  const postalCode = match[1]
  const city = match[2].trim()
  const street = lines.slice(0, -1).join(', ').trim()
  return { postalCode, city, street, ambiguous: false }
}

function detectLegacyAddress(data) {
  // Prefer the newer single `address` string, fall back to older split fields.
  if (data.address) return String(data.address)
  const parts = []
  if (data.street) parts.push(data.street)
  const line2 = [data.plz, data.city].filter(Boolean).join(' ')
  if (line2) parts.push(line2)
  if (parts.length > 0) return parts.join('\n')
  if (data.location) return String(data.location)
  return ''
}

function isGerman(country) {
  if (!country) return true // no country field = assume DE (legacy default)
  const c = String(country).trim().toLowerCase()
  return c === 'de' || c === 'deutschland' || c === 'germany'
}

async function migrateUser(docSnap) {
  const uid = docSnap.id
  const data = docSnap.data()

  // Already migrated?
  if (data.city && data.postalCode) {
    return { uid, status: 'skip-already-migrated' }
  }

  const raw = detectLegacyAddress(data)
  if (!raw) return { uid, status: 'skip-no-address' }

  let postalCode = ''
  let city = ''
  let street = ''
  let ambiguous = false

  if (!isGerman(data.country)) {
    // International address — we do NOT try to parse it. The entire raw
    // string is stashed as private.street; user re-enters city/postalCode.
    street = raw
    ambiguous = true
  } else {
    const parsed = parseGermanAddress(raw)
    if (parsed.ambiguous) {
      street = raw
      ambiguous = true
    } else {
      postalCode = parsed.postalCode
      city = parsed.city
      street = parsed.street
    }
  }

  const publicUpdate = {
    address: FieldValue.delete(),
    street: FieldValue.delete(),
    plz: FieldValue.delete(),
    location: FieldValue.delete()
  }
  if (city) publicUpdate.city = city
  if (postalCode) publicUpdate.postalCode = postalCode

  const privatePayload = { street: street || '' }

  if (DRY_RUN) {
    return {
      uid,
      status: ambiguous ? 'would-migrate-AMBIGUOUS' : 'would-migrate-OK',
      detected: { postalCode, city, streetChars: street.length },
      raw: raw.replace(/\n/g, ' \\n ')
    }
  }

  await db.doc(`users/${uid}`).update(publicUpdate)
  await db.doc(`users/${uid}/private/address`).set(privatePayload)

  return {
    uid,
    status: ambiguous ? 'migrated-AMBIGUOUS' : 'migrated-OK',
    detected: { postalCode, city, streetChars: street.length }
  }
}

async function main() {
  console.log(`\n🚀 Address migration ${DRY_RUN ? '(DRY RUN — no writes)' : '(LIVE — writing to Firestore)'}`)
  if (!DRY_RUN) {
    console.log('⚠️  Make sure you have run `gcloud firestore export` first!')
  }
  console.log()

  const usersSnap = await db.collection('users').get()
  console.log(`Found ${usersSnap.size} user documents.\n`)

  const counters = {}
  for (const docSnap of usersSnap.docs) {
    try {
      const result = await migrateUser(docSnap)
      counters[result.status] = (counters[result.status] || 0) + 1
      console.log(`[${result.status}] ${result.uid}`, result.detected || '', result.raw || '')
    } catch (err) {
      counters['error'] = (counters['error'] || 0) + 1
      console.error(`[error] ${docSnap.id}:`, err.message)
    }
  }

  console.log('\n📊 Summary:')
  for (const [k, v] of Object.entries(counters)) {
    console.log(`  ${k}: ${v}`)
  }
  console.log(DRY_RUN ? '\n(Dry run — nothing was written.)' : '\n✅ Migration complete.')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
