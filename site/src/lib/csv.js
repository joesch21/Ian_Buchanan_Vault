import Papa from 'papaparse'

export async function loadBibliography() {
  const url = new URL('../data/bibliography.csv', import.meta.url)
  const text = await fetch(url).then((r) => r.text())
  const { data } = Papa.parse(text.trim(), { header: true })
  return data
    .filter((r) => r.Year)
    .map((r) => {
      const year = Number(r.Year)
      const type = r.Type?.trim()
      const collaborators = (r['Co-authors/Editors'] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const tags = (r.Tags || '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      const citations = Number(r.Citations || 0)
      return {
        id: `${year}-${r.Title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        year,
        title: r.Title?.trim(),
        type,
        collaborators,
        venue: r.Publication?.trim(),
        isbn: (r.ISBN || '').trim(),
        PublisherURL: r.URL_Publisher,
        GoogleBooksURL: r.URL_GoogleBooks,
        PhilPapersURL: r.URL_PhilPapers,
        doi: r.DOI,
        tags,
        citations,
        ScholarURL: (r.ScholarURL || '').trim(),
        notes: (r.Notes || '').trim(),
        edition: (r.Edition || '').trim(),
        status: (r.Status || '').trim(),
      }
    })
}
