import Fuse from 'fuse.js'

export function parseSimpleCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  return lines.map((line) => {
    const [title, citations, url, year] = line.split(',').map((s) => s.trim())
    return { title, citations: Number(citations) || '', url, year: Number(year) || '' }
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
        DOI: '',
        URL_Publisher: '',
        URL_GoogleBooks: '',
        URL_PhilPapers: '',
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
