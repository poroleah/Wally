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
