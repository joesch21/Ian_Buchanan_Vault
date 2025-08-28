import Fuse from 'fuse.js'

export function computeCoverage(rows) {
  const total = rows.length
  const byType = rows.reduce((m, r) => (m[r.type] = (m[r.type] || 0) + 1, m), {})
  const isbnNeeded = rows.filter(r => ['Book', 'Edited volume'].includes(r.type))
  const doiNeeded = rows.filter(r => ['Article', 'Chapter'].includes(r.type))

  const pct = (n, d) => d ? Math.round((n / d) * 100) : 0

  return {
    total,
    byType,
    isbnFilledPct: pct(isbnNeeded.filter(r => (r.ISBN || '').trim()).length, isbnNeeded.length),
    doiFilledPct: pct(doiNeeded.filter(r => (r.DOI || '').trim()).length, doiNeeded.length),
    pubUrlPct: pct(rows.filter(r => (r.URL_Publisher || '').trim()).length, total)
  }
}

export function missingQueues(rows) {
  const needIsbn = rows.filter(r => ['Book', 'Edited volume'].includes(r.type) && !(r.ISBN || '').trim())
  const needDoi = rows.filter(r => ['Article', 'Chapter'].includes(r.type) && !(r.DOI || '').trim())
  const needUrl = rows.filter(r => !((r.URL_Publisher || r.URL_GoogleBooks || r.URL_PhilPapers || '').trim()))
  const needVerify = rows.filter(r => (r.Status || '').trim() !== 'confirmed')

  const fuse = new Fuse(rows, { keys: ['Title'], threshold: 0.28, ignoreLocation: true })
  const dups = []
  rows.forEach((r) => {
    const hits = fuse.search(r.Title).map(h => h.item).filter(it =>
      it !== r && it.Year === r.Year && it.Type === r.Type)
    if (hits.length) dups.push({ ref: r, candidates: hits })
  })

  return { needIsbn, needDoi, needUrl, needVerify, dups }
}
