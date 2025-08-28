import { useEffect, useMemo, useState } from 'react'
import './index.css'
import { loadBibliography } from './lib/csv.js'
import { loadNotes } from './lib/md.js'
import { createSearch } from './lib/search.js'
import { groupByYear, yearsRange } from './lib/group.js'
import { typeColors as TYPE_COLORS } from './lib/colors.js'
import { generateWiki } from './lib/wiki.js'

function App() {
  const [entries, setEntries] = useState([])
  const [notes, setNotes] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [bounds, setBounds] = useState([0, 0])
  const [yearRange, setYearRange] = useState([0, 0])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadBibliography().then((data) => {
      setEntries(data)
      const yrs = yearsRange(data)
      setBounds(yrs)
      setYearRange(yrs)
    })
    loadNotes().then(setNotes)
  }, [])

  const fuse = useMemo(() => createSearch(entries), [entries])

  const filtered = useMemo(() => {
    return entries
      .filter((e) => typeFilter === 'All' || e.type === typeFilter)
      .filter((e) => e.year >= yearRange[0] && e.year <= yearRange[1])
  }, [entries, typeFilter, yearRange])

  const results = useMemo(() => {
    if (!searchTerm) return filtered
    const matches = fuse.search(searchTerm).map((r) => r.item)
    return matches.filter((m) => filtered.includes(m))
  }, [searchTerm, fuse, filtered])

  const counts = useMemo(() => groupByYear(entries), [entries])
  const years = useMemo(
    () => Object.keys(counts).map((y) => parseInt(y)).sort((a, b) => a - b),
    [counts],
  )
  const maxCount = Math.max(0, ...Object.values(counts))
  const [minYear, maxYear] = bounds

  return (
    <div className="app container">
      <div className="header">
        <h1>Bibliography</h1>
      </div>
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Book">Book</option>
          <option value="Edited volume">Edited volume</option>
          <option value="Article">Article</option>
        </select>
        <button className="button" onClick={() => setYearRange([minYear, maxYear])}>
          Reset years
        </button>
        <label>
          {yearRange[0]}
          <input
            type="range"
            min={bounds[0]}
            max={bounds[1]}
            value={yearRange[0]}
            onChange={(e) =>
              setYearRange([Number(e.target.value), yearRange[1]])
            }
          />
        </label>
        <label>
          {yearRange[1]}
          <input
            type="range"
            min={bounds[0]}
            max={bounds[1]}
            value={yearRange[1]}
            onChange={(e) =>
              setYearRange([yearRange[0], Number(e.target.value)])
            }
          />
        </label>
      </div>
      <div className="timeline">
        {years.map((y) => {
          const count = counts[y]
          const height = maxCount ? (count / maxCount) * 50 : 0
          return (
            <div
              key={y}
              className="bar"
              style={{ height: `${height}px` }}
              onClick={() => setYearRange([y, y])}
              title={`${y} (${count})`}
            >
              <span className="year-label">{y}</span>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          {results.map((item) => (
            <div className="card" key={item.title + item.year}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
                <h3 style={{margin:'0 0 .25rem 0'}}>{item.title}</h3>
                <span className="badge" style={{background: TYPE_COLORS[item.type] || '#555', color:'#08121e'}}>
                  {item.type}
                </span>
              </div>
              <div style={{color:'var(--muted)'}}>{item.year} — {item.venue}</div>
              {item.collaborators.length > 0 && (
                <div style={{marginTop:4,fontSize:'.9rem'}}>With: {item.collaborators.join(', ')}</div>
              )}
              {item.isbn && <div style={{marginTop:4,fontSize:'.9rem',wordBreak:'break-word'}}>ISBN: {item.isbn}</div>}
              <div style={{marginTop:8, display:'flex', gap:8, flexWrap:'wrap'}}>
                {item.PublisherURL && <a className="badge" href={item.PublisherURL} target="_blank" rel="noreferrer">Publisher</a>}
                {item.GoogleBooksURL && <a className="badge" href={item.GoogleBooksURL} target="_blank" rel="noreferrer">Google Books</a>}
                {item.PhilPapersURL && <a className="badge" href={item.PhilPapersURL} target="_blank" rel="noreferrer">PhilPapers</a>}
              </div>
            </div>
          ))}
        </div>
        <div style={{width:'300px',flexShrink:0,display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div className="card">
            <strong>Wikipedia Block</strong>
            <textarea
              style={{width:'100%',height:'200px',marginTop:8,fontFamily:'monospace'}}
              readOnly
              value={generateWiki(filtered)}
            />
            <button className="button" style={{marginTop:8}}
              onClick={() => navigator.clipboard.writeText(generateWiki(filtered))}
            >
              Copy to clipboard
            </button>
          </div>
          <div className="card notes" dangerouslySetInnerHTML={{ __html: notes }} />
        </div>
      </div>
    </div>
  )
}

export default App
