import { API_ENDPOINTS } from '@/endpoints'
import { authJson } from './useFetch'
import analysis from '../../config/analysis.json'

// Client-side aggregation of the recorder's event history (/events), ported
// from mewly. Known limits (mewly와 동일): only trigger-matched events are
// counted, and clip auto-cleanup deletes their events with them, so past
// summaries shrink over time.

// Per-day fetch cap — anything beyond is truncated, so `total` can be
// compared against the sum to detect it.
const DAY_LIMIT = analysis.eventsDayLimit

// Aggregate one day's events into per-keyword 24-hour bins.
// Returns { total, cards: [{ keyword, total, bins[24], clipsByHour[24][] }] }.
export async function fetchDaySummary(dateIso) {
  const params = new URLSearchParams({
    date_from: dateIso,
    date_to: dateIso,
    limit: String(DAY_LIMIT),
  })
  const data = await authJson(`${API_ENDPOINTS.eventHistory}?${params}`)

  const byKeyword = new Map()
  for (const ev of data?.events || []) {
    const parsed = new Date(ev.created_at)
    if (Number.isNaN(parsed.getTime())) continue
    const hour = parsed.getHours()
    // trigger is a comma-joined string of the matched keywords
    // ("sitting,looking"). Split it so a simultaneous match counts once on
    // every matching keyword's card.
    for (const keyword of String(ev.trigger || '').split(',').map((k) => k.trim()).filter(Boolean)) {
      let card = byKeyword.get(keyword)
      if (!card) {
        card = {
          keyword,
          total: 0,
          bins: Array(24).fill(0),
          clipsByHour: Array.from({ length: 24 }, () => []),
        }
        byKeyword.set(keyword, card)
      }
      card.total += 1
      card.bins[hour] += 1
      if (ev.clip_name) card.clipsByHour[hour].push(ev.clip_name)
    }
  }

  const cards = [...byKeyword.values()].sort((a, b) => b.total - a.total)
  return { total: data?.total ?? cards.reduce((a, c) => a + c.total, 0), cards }
}
