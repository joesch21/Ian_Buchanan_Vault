// /src/lib/wiki.js
// Generates Wikipedia-ready wikitext from normalized entries.
// Sections: Authored books / Edited books / Selected articles.

export function generateWiki(entries) {
  const authored = entries
    .filter(e => e.type === 'Book')
    .sort((a, b) => a.title.localeCompare(b.title))
  const edited = entries
    .filter(e => e.type === 'Edited volume')
    .sort((a, b) => a.title.localeCompare(b.title))
  const articles = entries
    .filter(e => e.type === 'Article')
    .sort((a, b) => a.title.localeCompare(b.title))

  const fmtBook = b =>
    `* ''${b.title}''.` +
    (b.venue ? ` ${b.venue}.` : '') +
    (b.year ? ` ${b.year}.` : '') +
    (b.isbn ? ` ISBN ${b.isbn}.` : '')

  const fmtEdited = e =>
    `* ${e.collaborators && e.collaborators.length ? e.collaborators.join('; ') + ' (eds.). ' : ''}` +
    `''${e.title}''.` +
    (e.venue ? ` ${e.venue}.` : '') +
    (e.year ? ` ${e.year}.` : '')

  const fmtArticle = a =>
    `* "${a.title}."` +
    (a.venue ? ` ''${a.venue}''` : '') +
    (a.year ? ` (${a.year})` : '') +
    (a.doi ? `. doi:${a.doi}` : '')

  const blocks = []
  if (authored.length) blocks.push('===Authored books===\n' + authored.map(fmtBook).join('\n'))
  if (edited.length) blocks.push('===Edited books===\n' + edited.map(fmtEdited).join('\n'))
  if (articles.length) blocks.push('===Selected articles===\n' + articles.map(fmtArticle).join('\n'))

  return blocks.join('\n\n')
}

