import Papa from 'papaparse'

export async function loadBibliography() {
  const url = new URL('../data/bibliography.csv', import.meta.url)
  const text = await fetch(url).then((r) => r.text())
  const { data } = Papa.parse(text.trim(), { header: true })
  return data
    .filter((r) => r.Year)
    .map((r) => ({
      year: Number(r.Year),
      title: r.Title,
      type: r.Type,
      collaborators: r['Co-authors/Editors']
        ? r['Co-authors/Editors']
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      venue: r.Publication,
      isbn: r.ISBN,
      PublisherURL: r.PublisherURL,
      GoogleBooksURL: r.GoogleBooksURL,
      PhilPapersURL: r.PhilPapersURL,
      doi: r.DOI,
      tags: r.Tags
        ? r.Tags.split(';').map((s) => s.trim()).filter(Boolean)
        : [],
    }))
}
