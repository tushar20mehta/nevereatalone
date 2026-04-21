/**
 * Shared helpers for dinner date handling.
 *
 * The `dinner.date` field may appear in Firestore in several formats
 * (written at different times by different parts of the app, or coming
 * from hand-seeded data):
 *
 *   - ISO string         "2026-05-15"  or  "2026-05-15T19:00:00.000Z"
 *   - German string      "15.05.2026"
 *   - Firestore Timestamp { toDate(), seconds, nanoseconds }
 *   - Plain JS Date
 *   - Millisecond number (epoch)
 *
 * `parseDinnerDate` accepts all of them and returns a local JS Date at
 * the correct point in time, or null if the value is unusable. This
 * guarantees that `isPastDinner` NEVER throws — so the filters
 *   upcoming = dinners.filter(d => !isPastDinner(d))
 *   past     = dinners.filter(d =>  isPastDinner(d))
 * always partition the input exactly (upcoming.length + past.length ===
 * dinners.length), independent of what the raw data looks like.
 */

/**
 * Parse `dinner.date` (+ optional `dinner.time`) into a local Date.
 * Returns null if the data can't be parsed.
 */
export function parseDinnerDate(dinner) {
  if (!dinner || dinner.date == null) return null
  const raw = dinner.date

  let date = null

  try {
    // Firestore Timestamp (has toDate method)
    if (raw && typeof raw.toDate === 'function') {
      date = raw.toDate()
    }
    // Already a Date instance
    else if (raw instanceof Date) {
      date = new Date(raw.getTime())
    }
    // Serialized Timestamp: { seconds, nanoseconds }
    else if (raw && typeof raw === 'object' && typeof raw.seconds === 'number') {
      date = new Date(raw.seconds * 1000)
    }
    // Milliseconds since epoch
    else if (typeof raw === 'number' && Number.isFinite(raw)) {
      date = new Date(raw)
    }
    // String: try explicit formats, then fall back to Date parser
    else if (typeof raw === 'string') {
      const s = raw.trim()

      // ISO-prefixed "YYYY-MM-DD[...]": take the date part, build a
      // local-midnight Date (avoids the UTC-parsing timezone shift
      // where "2026-05-15" becomes 2026-05-14 23:00 in CET).
      const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (iso) {
        date = new Date(
          parseInt(iso[1], 10),
          parseInt(iso[2], 10) - 1,
          parseInt(iso[3], 10)
        )
      }
      // German "DD.MM.YYYY" (or "D.M.YYYY")
      else {
        const de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
        if (de) {
          date = new Date(
            parseInt(de[3], 10),
            parseInt(de[2], 10) - 1,
            parseInt(de[1], 10)
          )
        } else {
          const parsed = new Date(s)
          if (!isNaN(parsed.getTime())) date = parsed
        }
      }
    }
  } catch {
    return null
  }

  if (!date || isNaN(date.getTime())) return null

  // Apply `dinner.time` ("HH:mm" or "HH:mm:ss") if set.
  // No time given → treat as end-of-day so same-day events stay
  // "upcoming" until midnight.
  if (dinner.time != null) {
    const t = String(dinner.time).trim()
    const m = t.match(/^(\d{1,2}):(\d{2})/)
    if (m) {
      date.setHours(
        parseInt(m[1], 10) || 0,
        parseInt(m[2], 10) || 0,
        0,
        0
      )
    } else {
      date.setHours(23, 59, 59, 999)
    }
  } else {
    date.setHours(23, 59, 59, 999)
  }

  return date
}

/**
 * True iff the dinner is strictly in the past.
 * Guaranteed to return a boolean — never throws.
 */
export function isPastDinner(dinner, now = new Date()) {
  try {
    const d = parseDinnerDate(dinner)
    if (!d) return false
    return d.getTime() < now.getTime()
  } catch {
    return false
  }
}
