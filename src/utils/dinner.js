/**
 * Shared helpers for dinner date handling.
 */

/**
 * Returns true if the dinner's date (combined with its time, when present)
 * lies in the past relative to `now`.
 *
 * Accepted date formats: ISO `YYYY-MM-DD`, or anything `new Date()` can parse.
 * A dinner without a date is treated as NOT past (keeps drafts visible).
 */
export function isPastDinner(dinner, now = new Date()) {
  if (!dinner?.date) return false

  const dinnerDate = new Date(dinner.date)
  if (isNaN(dinnerDate.getTime())) return false

  if (dinner.time) {
    const [hours, minutes] = String(dinner.time).split(':')
    dinnerDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
    return dinnerDate < now
  }

  // No time given — compare day-granularity.
  dinnerDate.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return dinnerDate < today
}
