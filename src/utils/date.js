export function pad2(value) {
  return String(value).padStart(2, '0')
}

export function formatDateQuery(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function dateObjectToKey(date) {
  if (!date?.year || !date?.month || !date?.day) return ''
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`
}

// 날짜 키(YYYY-MM-DD)의 생성·해석은 로컬 시간 기준으로 통일한다 —
// new Date('YYYY-MM-DD')는 UTC 자정으로 해석되어 서측 시간대에서 하루가
// 어긋난다 (mewly dates.js 이식).
export function toIsoDate(date = new Date(), offsetDays = 0) {
  const d = new Date(date)
  if (offsetDays) d.setDate(d.getDate() + offsetDays)
  return formatDateQuery(d)
}

export function parseIsoDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, m - 1, d)
}
