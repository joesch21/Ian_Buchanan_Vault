export function generateWiki(entries = []) {
  const authored = []
  const edited = []
  const articles = []

  for (const entry of entries) {
    const type = (entry.type || '').toLowerCase()
    if (type.includes('edited')) {
      edited.push(entry)
    } else if (type.includes('article')) {
      articles.push(entry)
    } else {
      authored.push(entry)
    }
  }

  const formatNames = (names = []) => {
    const list = Array.isArray(names) ? names : [names]
    if (list.length === 0) return ''
    if (list.length === 1) return list[0]
    return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
  }

  const authoredText = authored
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((b) => {
      let line = `* ''${b.title}''`
      const details = []
      if (b.publisher) details.push(b.publisher)
      if (b.year) details.push(b.year)
      if (details.length) line += `. ${details.join(', ')}`
      if (b.isbn13) line += `. ISBN ${b.isbn13}`
      return line
    })
    .join('\n')

  const editedText = edited
    .map((b) => {
      let line = `* ''${b.title}''`
      const editors = formatNames(b.editors || b.editor)
      if (editors) line += `. Edited by ${editors}`
      const details = []
      if (b.publisher) details.push(b.publisher)
      if (b.year) details.push(b.year)
      if (details.length) line += `. ${details.join(', ')}`
      return line
    })
    .join('\n')

  const articleText = articles
    .map((a) => {
      let line = `* ''${a.title}''`
      const parts = []
      if (a.journal) parts.push(`''${a.journal}''`)
      const volIssue = [a.volume, a.issue && `(${a.issue})`].filter(Boolean).join('')
      if (volIssue) parts.push(volIssue)
      if (a.pages) parts.push(a.pages)
      if (a.doi) parts.push(`doi:${a.doi}`)
      if (parts.length) line += `. ${parts.join(', ')}`
      return line
    })
    .join('\n')

  return [
    '===Authored books===',
    '',
    authoredText,
    '',
    '===Edited books===',
    '',
    editedText,
    '',
    '===Selected articles===',
    '',
    articleText,
  ].join('\n')
}
