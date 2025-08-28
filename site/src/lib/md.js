import { marked } from 'marked'

export async function loadNotes() {
  const url = new URL('../data/notes.md', import.meta.url)
  const text = await fetch(url).then((r) => r.text())
  return marked.parse(text)
}
