export function groupByYear(items) {
  return items.reduce((acc, item) => {
    acc[item.year] = (acc[item.year] || 0) + 1
    return acc
  }, {})
}

export function yearsRange(items) {
  const years = items.map((i) => i.year)
  if (years.length === 0) return [0, 0]
  return [Math.min(...years), Math.max(...years)]
}
