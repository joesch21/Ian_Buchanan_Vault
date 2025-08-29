import Fuse from 'fuse.js'

export function parseSimpleCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  return lines.map((line) => {
    const [title, citations, url, year, doi, philurl] = line
      .split(',')
      .map((s) => s.trim())
    return {
      title,
      citations: citations ? Number(citations) : '',
      url,
      year: year ? Number(year) : '',
      doi,
      philurl,
    }
  })
}

export function mergeExternal(masterRows, extRows) {
  const fuse = new Fuse(masterRows, { keys: ['Title'], threshold: 0.28, ignoreLocation: true })
  const updated = [...masterRows]
  const additions = []
  extRows.forEach((ext) => {
    const hit = fuse.search(ext.title)[0]?.item
    if (hit) {
      hit.Citations = ext.citations || hit.Citations
      hit.ScholarURL = ext.url || hit.ScholarURL
      hit.DOI = ext.doi || hit.DOI
      hit.URL_PhilPapers = ext.philurl || hit.URL_PhilPapers
      if (ext.year && /^\d{4}$/.test(String(ext.year))) hit.Year = hit.Year || ext.year
    } else {
      additions.push({
        Year: ext.year || '',
        Title: ext.title,
        Type: '',
        'Co-authors/Editors': '',
        Publication: '',
        ISBN: '',
        Tags: '',
        DOI: ext.doi || '',
        URL_Publisher: '',
        URL_GoogleBooks: '',
        URL_PhilPapers: ext.philurl || '',
        Notes: 'NEEDS TRIAGE (imported)',
        Citations: ext.citations || '',
        ScholarURL: ext.url || '',
        Edition: '',
        Status: 'needs_verification',
      })
    }
  })
  return { updated, additions }
}
