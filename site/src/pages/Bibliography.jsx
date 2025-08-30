import React, { useEffect, useState } from 'react'

export default function Bibliography() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/data/ian_buchanan_orcid.csv')
      .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
      .then(txt => {
        const [head, ...lines] = txt.trim().split('\n')
        const headers = head.split(',').map(h => h.replace(/^"|"$/g, ''))
        const parsed = lines.slice(0, 200).map(line => {
          const cols = line.match(/("([^"]|"")*"|[^,]+)/g) || []
          return headers.reduce((o, h, i) => {
            o[h] = (cols[i] || '').replace(/^"|"$/g, '').replace(/""/g, '"')
            return o
          }, {})
        })
        setRows(parsed)
      })
      .catch(e => setErr(String(e)))
  }, [])

  if (err) return <p style={{color:'crimson'}}>Failed to load bibliography: {err}</p>
  if (!rows.length) return <p>Loading bibliography…</p>

  return (
    <div>
      <h2>Bibliography</h2>
      <ul>
        {rows.map((r, i) => (
          <li key={i}>
            <strong>{r.title || '(untitled)'}</strong>
            {r.year ? ` — ${r.year}` : ''}
            {r.journal_or_publisher ? ` — ${r.journal_or_publisher}` : ''}
            {r.doi && (
              <> — DOI: <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">{r.doi}</a></>
            )}
          </li>
        ))}
      </ul>
      <p style={{marginTop:'1rem'}}>
        <a href="/data/ian_buchanan_orcid.csv">Download CSV</a> ·{' '}
        <a href="/data/ian_buchanan_orcid.md">View Markdown</a>
      </p>
    </div>
  )
}

