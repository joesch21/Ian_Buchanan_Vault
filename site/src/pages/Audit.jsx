import React, { useMemo } from 'react'
import Papa from 'papaparse'
import { computeCoverage, missingQueues } from '../lib/audit.js'
import { generateWiki } from '../lib/wiki.js'
import bibliographyCsv from '../data/bibliography.csv?url'

export default function Audit() {
  const [rows, setRows] = React.useState([])
  React.useEffect(() => {
    fetch(bibliographyCsv).then(r => r.text()).then(t => {
      const { data } = Papa.parse(t, { header: true, skipEmptyLines: true })
      setRows(data.map(r => ({ ...r, type: r.Type })))
    })
  }, [])

  const coverage = useMemo(() => computeCoverage(rows), [rows])
  const queues = useMemo(() => missingQueues(rows), [rows])

  const exportCsv = () => {
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <h1>Audit & Coverage</h1>

      <div className="grid">
        <div className="card"><strong>Total</strong><div>{coverage.total}</div></div>
        <div className="card"><strong>Books</strong><div>{coverage.byType['Book']||0}</div></div>
        <div className="card"><strong>Edited</strong><div>{coverage.byType['Edited volume']||0}</div></div>
        <div className="card"><strong>Articles</strong><div>{coverage.byType['Article']||0}</div></div>
        <div className="card"><strong>ISBN filled</strong><div>{coverage.isbnFilledPct}%</div></div>
        <div className="card"><strong>DOI filled</strong><div>{coverage.doiFilledPct}%</div></div>
        <div className="card"><strong>Has URL</strong><div>{coverage.pubUrlPct}%</div></div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <strong>Missing ISBN (Books/Edited)</strong>
        <ul>{queues.needIsbn.map((r,i)=><li key={i}>{r.Year} — {r.Title}</li>)}</ul>
      </div>

      <div className="card">
        <strong>Missing DOI (Articles/Chapters)</strong>
        <ul>{queues.needDoi.map((r,i)=><li key={i}>{r.Year} — {r.Title}</li>)}</ul>
      </div>

      <div className="card">
        <strong>No External URL</strong>
        <ul>{queues.needUrl.map((r,i)=><li key={i}>{r.Year} — {r.Title}</li>)}</ul>
      </div>

      <div className="card">
        <strong>Needs Verification (Status ≠ confirmed)</strong>
        <ul>{queues.needVerify.map((r,i)=><li key={i}>{r.Year} — {r.Title} ({r.Status||'unset'})</li>)}</ul>
      </div>

      <div className="card">
        <strong>Potential Duplicates (fuzzy)</strong>
        <ul>{queues.dups.map((d,i)=>
          <li key={i}>
            {d.ref.Year} — {d.ref.Title}
            <ul>{d.candidates.map((c,j)=><li key={j}>{c.Year} — {c.Title}</li>)}</ul>
          </li>)}</ul>
      </div>

      <div style={{marginTop:20, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="button" onClick={() => navigator.clipboard.writeText(generateWiki(rows))}>Copy Wiki</button>
        <button className="button" onClick={exportCsv}>Export CSV</button>
        <button className="button" onClick={exportJson}>Export JSON</button>
      </div>
    </div>
  )
}
