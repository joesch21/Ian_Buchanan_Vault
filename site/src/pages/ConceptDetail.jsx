import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TAGS, TAG_DESCRIPTIONS } from '../lib/tags.js'
import { slugify } from '../lib/slug.js'
import { generateWiki } from '../lib/wiki.js'

export default function ConceptDetail({ data }) {
  const { slug } = useParams()
  const tag = TAGS.find(t => slugify(t) === slug)
  const desc = TAG_DESCRIPTIONS[tag] || ''
  const works = useMemo(() => data.filter(w => w.tags?.includes(tag)), [data, tag])

  const byType = useMemo(() => {
    const m = new Map()
    for (const w of works) m.set(w.type, (m.get(w.type) || 0) + 1)
    return Array.from(m.entries()).sort()
  }, [works])

  const years = works.map(w => w.year).filter(Boolean).sort((a, b) => a - b)
  const firstYear = years[0]
  const lastYear = years[years.length - 1]

  const wiki = generateWiki(works)

  const download = (rows, name, format) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
    } else {
      const headers = Object.keys(rows[0] || {})
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
    }
  }

  if (!tag) {
    return (
      <div className="container">
        <h1>Concept not found</h1>
        <Link className="link-pill" to="/concepts">Back to Concepts</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>{tag}</h1>
        <Link className="link-pill" to="/concepts">All concepts</Link>
      </div>

      {desc && <p className="small-muted" style={{ marginTop: 0 }}>{desc}</p>}

      <div className="grid" style={{ marginTop: '1rem' }}>
        <div className="col-8">
          <div className="card">
            <strong>Overview</strong>
            <div style={{ marginTop: 8, color: 'var(--muted)' }}>
              {works.length} works · {firstYear || '—'} — {lastYear || '—'}
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {byType.map(([t, c]) => <span key={t} className="badge">{t}: {c}</span>)}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="button" onClick={() => download(works, `${slug}-works.csv`, 'csv')}>Export CSV</button>
                <button className="button" onClick={() => download(works, `${slug}-works.json`, 'json')}>Export JSON</button>
              </div>
            </div>
          </div>

          {works.map(item => (
            <div className="card" key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <h3 style={{ margin: '0 0 .25rem 0' }}>{item.title}</h3>
                <span className="badge">{item.type}</span>
              </div>
              <div className="small-muted">{item.year} — {item.venue}</div>
              {item.citations !== undefined && (
                <div className="meta-row"><span className="cite-badge">★ {item.citations || 0}</span></div>
              )}
            </div>
          ))}
          {works.length === 0 && <div className="card">No works tagged “{tag}”.</div>}
        </div>

        <aside className="col-4">
          <div className="card">
            <strong>Wikipedia Block for “{tag}”</strong>
            <textarea style={{ width: '100%', height: '220px', marginTop: 8, fontFamily: 'monospace' }} readOnly value={wiki} />
            <button className="button" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(wiki)}>Copy</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
