import { useEffect, useState } from 'react'

export default function Compare() {
  const [summary, setSummary] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/data/compare/summary.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setSummary)
      .catch(e => setErr(String(e)))
  }, [])

  if (err) return <p style={{color:'crimson'}}>Failed to load comparison: {err}</p>
  if (!summary) return <p>Loading comparison…</p>

  const { years, authors } = summary
  return (
    <div>
      <h2>Author Comparison</h2>
      <p>
        Matrix shows totals and per-year counts for each ORCID ingested.
        Raw CSV: <a href="/data/compare/matrix.csv">matrix.csv</a>
      </p>

      <table border="1" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th>ORCID</th>
            <th>Total</th>
            {years.map(y => <th key={y}>{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {authors.map(a => (
            <tr key={a.orcid_id}>
              <td><code>{a.orcid_id}</code></td>
              <td>{a.total}</td>
              {years.map(y => <td key={y}>{a.by_year[y] || 0}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:'1.5rem'}}>Per-author dumps</h3>
      <ul>
        {authors.map(a => (
          <li key={a.orcid_id}>
            <code>{a.orcid_id}</code> — <a href={`/data/${a.orcid_id}.csv`}>CSV</a> · <a href={`/data/${a.orcid_id}.md`}>MD</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
