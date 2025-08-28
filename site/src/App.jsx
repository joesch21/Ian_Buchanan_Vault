import { useEffect, useMemo, useState } from 'react'
import './index.css'
import { loadBibliography } from './lib/csv.js'
import { loadNotes } from './lib/md.js'
import { createSearch } from './lib/search.js'
import { groupByYear, yearsRange } from './lib/group.js'
import { typeColors as TYPE_COLORS } from './lib/colors.js'
import { generateWiki } from './lib/wiki.js'
import { TAGS } from './lib/tags.js'

function App() {
  const [entries, setEntries] = useState([])
  const [notes, setNotes] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [bounds, setBounds] = useState([0, 0])
  const [yearRange, setYearRange] = useState([0, 0])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [heatOn, setHeatOn] = useState(true)
  const [topN, setTopN] = useState(10)

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
      .filter((e) => activeTags.every((t) => e.tags.includes(t)))
  }, [entries, typeFilter, yearRange, activeTags])

  const results = useMemo(() => {
    if (!searchTerm) return filtered
    const matches = fuse.search(searchTerm).map((r) => r.item)
    return matches.filter((m) => filtered.includes(m))
  }, [searchTerm, fuse, filtered])

  const displayList = useMemo(() => {
    let arr = results
    if (heatOn) {
      arr = [...arr].sort((a, b) => (b.citations || 0) - (a.citations || 0))
      if (topN > 0) arr = arr.slice(0, topN)
    }
    return arr
  }, [results, heatOn, topN])

  const counts = useMemo(() => groupByYear(entries), [entries])
  const years = useMemo(
    () => Object.keys(counts).map((y) => parseInt(y)).sort((a, b) => a - b),
    [counts],
  )
  const citationsByYear = useMemo(() => {
    const map = new Map()
    for (const d of entries) map.set(d.year, (map.get(d.year) || 0) + (d.citations || 0))
    return map
  }, [entries])
  const maxCount = Math.max(0, ...Object.values(counts))
  const maxCite = Math.max(1, ...Array.from(citationsByYear.values()))
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
        <label style={{display:'flex',alignItems:'center',gap:6}}>
          <input type="checkbox" checked={heatOn} onChange={(e)=>setHeatOn(e.target.checked)} />
          Heat view
        </label>
        <label style={{display:'flex',alignItems:'center',gap:6}}>
          Top N
          <input className="input" style={{width:70}} type="number" min={3} max={50}
            value={topN} onChange={(e)=>setTopN(Number(e.target.value||10))}/>
        </label>
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
          const yrCites = citationsByYear.get(y) || 0
          const alpha = Math.min(0.9, (yrCites / maxCite) ** 0.5)
          const bg = `rgba(76,154,255,${alpha})`
          return (
            <div
              key={y}
              className="bar"
              style={{ height: `${height}px`, background: bg }}
              onClick={() => setYearRange([y, y])}
              title={`${y}: ${count} works • ${yrCites} cites`}
            >
              <span className="year-label">{y}</span>
            </div>
          )
        })}
      </div>
      <div style={{marginTop:6, color:'var(--muted)'}}>
        Heat = yearly citations (darker = more cites)
      </div>
      <div className="heat-legend" style={{marginTop:6}}>
        <span className="heat-swatch"></span>
        <span className="heat-swatch mid"></span>
        <span className="heat-swatch max"></span>
        <span>low → high citations</span>
      </div>
      <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          {displayList.map((item) => (
            <div className="card" key={item.title + item.year}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
                <h3 style={{margin:'0 0 .25rem 0'}}>{item.title}</h3>
                <span className="badge" style={{background: TYPE_COLORS[item.type] || '#555', color:'#08121e'}}>
                  {item.type}
                </span>
              </div>
              <div style={{color:'var(--muted)'}}>{item.year} — {item.venue}</div>
              <div style={{marginTop:6, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <span className="badge" title="Google Scholar citations">★ {item.citations || 0}</span>
                {item.ScholarURL && <a className="badge" href={item.ScholarURL} target="_blank" rel="noreferrer">Scholar</a>}
              </div>
              {item.collaborators.length > 0 && (
                <div style={{marginTop:4,fontSize:'.9rem'}}>With: {item.collaborators.join(', ')}</div>
              )}
              {item.isbn && <div style={{marginTop:4,fontSize:'.9rem',wordBreak:'break-word'}}>ISBN: {item.isbn}</div>}
              {item.tags.length > 0 && (
                <div style={{marginTop:8, display:'flex', gap:6, flexWrap:'wrap'}}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge"
                      style={{ background: '#232734', color: 'var(--muted)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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
            <strong>Tags</strong>
            <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:6}}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  className="badge"
                  style={{
                    cursor: 'pointer',
                    background: activeTags.includes(tag) ? 'var(--accent)' : '#232734',
                    color: activeTags.includes(tag) ? '#08121e' : 'var(--muted)',
                  }}
                  onClick={() =>
                    setActiveTags((t) =>
                      t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag],
                    )
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
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
