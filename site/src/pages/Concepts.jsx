import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TAGS } from '../lib/tags.js'
import { slugify } from '../lib/slug.js'

export default function Concepts({ data }) {
  const counts = useMemo(() => {
    const m = new Map()
    for (const t of TAGS) m.set(t, 0)
    data.forEach(w => w.tags?.forEach(t => m.set(t, (m.get(t) || 0) + 1)))
    return m
  }, [data])

  return (
    <div className="container">
      <h1>Concepts</h1>
      <div className="grid">
        {TAGS.map(tag => (
          <div key={tag} className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <h3 style={{margin:0}}>{tag}</h3>
              <span className="badge">{counts.get(tag) || 0} works</span>
            </div>
            <div style={{marginTop:8}}>
              <Link className="link-pill" to={`/concept/${slugify(tag)}`}>Open</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
