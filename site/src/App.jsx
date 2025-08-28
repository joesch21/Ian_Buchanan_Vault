import { useEffect, useMemo, useState } from 'react'
import './index.css'
import { loadBibliography } from './lib/csv.js'
import { loadNotes } from './lib/md.js'
import { createSearch } from './lib/search.js'
import { groupByYear, yearsRange } from './lib/group.js'
import { typeColors } from './lib/colors.js'

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

  return (
    <div className="app">
      <h1>Bibliography</h1>
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
      <div className="results">
        {results.map((item) => (
          <div className="card" key={item.title + item.year}>
            <div className="card-header">
              <span className="year">{item.year}</span>
              <span
                className="type"
                style={{ background: typeColors[item.type] || '#666' }}
              >
                {item.type}
              </span>
            </div>
            <h3>{item.title}</h3>
            {item.venue && <p className="venue">{item.venue}</p>}
            {item.collaborators.length > 0 && (
              <p className="collab">{item.collaborators.join(', ')}</p>
            )}
            {item.isbn && <p className="isbn">ISBN: {item.isbn}</p>}
          </div>
        ))}
      </div>
      <div className="notes" dangerouslySetInnerHTML={{ __html: notes }} />
    </div>
  )
}

export default App
