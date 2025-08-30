import { useMemo, useState, useEffect } from 'react';
import MultiSelect from '../components/MultiSelect.jsx';
import { loadScholars } from '../lib/loadLists.js';

const fmt = (x) => (x ?? '').toString();
const norm = (s) => fmt(s).toLowerCase().trim().replace(/\s+/g,' ').replace(/[^\w\s]/g,'');

function dedupeRows(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const doi = fmt(r.doi).toLowerCase();
    const key = doi
      ? `doi:${doi}`
      : `ty:${norm(r.title)}|${fmt(r.year)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function toCSV(rows) {
  const headers = ['author_orcid','title','year','type','journal_or_publisher','doi','url'];
  const esc = (s) => `"${fmt(s).replace(/"/g,'""')}"`;
  const body = rows.map(r => headers.map(h => esc(r[h] ?? '')).join(',')).join('\n');
  return headers.join(',') + '\n' + body;
}

function toMarkdown(rows) {
  const lines = ['# Comparison Export\n'];
  const sorted = [...rows].sort((a,b)=>(fmt(b.year).localeCompare(fmt(a.year)) || norm(a.title).localeCompare(norm(b.title))));
  for (const r of sorted) {
    const bits = [`**${fmt(r.title)||'(untitled)'}**`];
    if (r.year) bits.push(r.year);
    if (r.journal_or_publisher) bits.push(r.journal_or_publisher);
    if (r.type) bits.push(`_${r.type}_`);
    if (r.doi) bits.push(`DOI: ${r.doi}`);
    if (r.url) bits.push(`[link](${r.url})`);
    lines.push(`- ${bits.join(' — ')}`);
  }
  return lines.join('\n');
}

function useExamples(setOrcids, fetchData) {
  const examples = [
    '0000-0003-4864-6495', // Ian Buchanan
    '0000-0001-2345-6789', // placeholder – replace with a real ORCID
    '0000-0002-9876-5432'  // placeholder – replace with a real ORCID
  ].join(', ');
  setOrcids(examples);
  fetchData();
}

export default function Compare() {
  const [orcids, setOrcids] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('year-desc'); // year-desc|year-asc|title|type
  const [typeSet, setTypeSet] = useState(new Set()); // toggle pills
  const [scholarGroups, setScholarGroups] = useState([]);
  const [selScholars, setSelScholars] = useState(new Set()); // ids

  useEffect(() => { loadScholars().then(setScholarGroups); }, []);
  useEffect(() => {
    try {
      const a = new Set(JSON.parse(localStorage.getItem('selScholars') || '[]'));
      setSelScholars(a);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem('selScholars', JSON.stringify(Array.from(selScholars)));
  }, [selScholars]);

  function applySelectedScholars() {
    const all = scholarGroups.flatMap(g => g.members);
    const chosen = all.filter(m => selScholars.has(m.id) && m.orcid);
    const existing = orcids.split(',').map(s=>s.trim()).filter(Boolean);
    const merged = Array.from(new Set([...existing, ...chosen.map(m => m.orcid)]));
    setOrcids(merged.join(', '));
  }

  function clearOrcids() {
    setOrcids('');
    setSelScholars(new Set());
    localStorage.removeItem('selScholars');
  }

  async function fetchData() {
    setLoading(true);
    setRows([]);
    const ids = orcids.split(',').map(s => s.trim()).filter(Boolean);
    let all = [];
    for (const id of ids) {
      try {
        const res = await fetch(`/api/orcid?orcid=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data?.ok && Array.isArray(data.rows)) {
          const mapped = data.rows.map(r => ({
            author_orcid: id,
            title: r.title || '',
            year: r.year || '',
            type: r.type || '',
            journal_or_publisher: r.journal_or_publisher || '',
            doi: r.doi || '',
            url: r.url || ''
          }));
          all = all.concat(mapped);
        }
      } catch { /* skip */ }
    }
    setRows(dedupeRows(all));
    setLoading(false);
  }

  const allTypes = useMemo(() => {
    const s = new Set();
    rows.forEach(r => s.add(r.type || 'other'));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let cur = rows;
    const needle = q.toLowerCase().trim();
    if (needle) {
      cur = cur.filter(r =>
        fmt(r.title).toLowerCase().includes(needle) ||
        fmt(r.year).toLowerCase().includes(needle) ||
        fmt(r.journal_or_publisher).toLowerCase().includes(needle) ||
        fmt(r.doi).toLowerCase().includes(needle)
      );
    }
    if (typeSet.size) cur = cur.filter(r => typeSet.has(r.type || 'other'));

    const sorters = {
      'year-desc': (a,b) => fmt(b.year).localeCompare(fmt(a.year)) || norm(a.title).localeCompare(norm(b.title)),
      'year-asc' : (a,b) => fmt(a.year).localeCompare(fmt(b.year)) || norm(a.title).localeCompare(norm(b.title)),
      'title'    : (a,b) => norm(a.title).localeCompare(norm(b.title)),
      'type'     : (a,b) => fmt(a.type).localeCompare(fmt(b.type)) || fmt(b.year).localeCompare(fmt(a.year)),
    };
    return [...cur].sort(sorters[sort]);
  }, [rows, q, sort, typeSet]);

  function download(text, filename, type='text/plain') {
    const blob = new Blob([text], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const toggleType = (t) => {
    const next = new Set(typeSet);
    next.has(t) ? next.delete(t) : next.add(t);
    setTypeSet(next);
  };

  return (
    <div className="container">
      <h2>Compare Bibliographies</h2>

      <div style={{display:'grid',gap:12,marginBottom:12}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:8}}>
          {scholarGroups.map(g => (
            <MultiSelect
              key={g.id}
              label={`Scholars: ${g.label}`}
              items={g.members}
              idKey="id"
              labelKey="name"
              selected={selScholars}
              onChange={setSelScholars}
            />
          ))}
          <button className="btn" onClick={() => { applySelectedScholars(); fetchData(); }}>
            Add & Fetch
          </button>
          <button className="btn" onClick={clearOrcids} title="Clear ORCIDs input & selections">
            Clear ORCIDs
          </button>
        </div>
        <label>
          ORCIDs (comma-separated)
          <input
            style={{width:'100%',padding:'8px',marginTop:6}}
            placeholder="0000-0003-4864-6495, 0000-0001-2345-6789"
            value={orcids}
            onChange={(e)=>setOrcids(e.target.value)}
          />
        </label>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn primary" onClick={fetchData} disabled={loading}>
            {loading ? 'Loading…' : 'Fetch'}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useExamples(setOrcids, fetchData);
            }}
            title="Prefill with sample ORCIDs and fetch"
          >
            Use examples
          </button>
          {filtered.length>0 && (
            <>
              <button className="btn" onClick={()=>download(toCSV(filtered),'compare.csv','text/csv')}>Download CSV</button>
              <button className="btn" onClick={()=>download(toMarkdown(filtered),'compare.md')}>View Markdown</button>
            </>
          )}
        </div>

        <div style={{display:'grid',gap:8}}>
          <label>
            Search / Year / Venue / DOI
            <input
              style={{width:'100%',padding:'8px',marginTop:6}}
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="e.g. 2023, assemblage, 10.1080/…"
            />
          </label>

          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span>Sort:</span>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} style={{padding:'6px'}}>
              <option value="year-desc">Year (new → old)</option>
              <option value="year-asc">Year (old → new)</option>
              <option value="title">Title (A→Z)</option>
              <option value="type">Type</option>
            </select>

            <span style={{marginLeft:12}}>Type:</span>
            {allTypes.map(t => (
              <button
                key={t||'other'}
                onClick={()=>toggleType(t||'other')}
                className="btn"
                style={{
                  borderColor: typeSet.has(t||'other') ? '#333' : '#ddd',
                  background: typeSet.has(t||'other') ? '#f0f0f0' : '#fff'
                }}
              >
                {t || 'other'}
              </button>
            ))}
            {typeSet.size>0 && (
              <button className="btn" onClick={()=>setTypeSet(new Set())}>Clear types</button>
            )}
          </div>
        </div>
      </div>

      {filtered.length>0 ? (
        <div style={{overflowX:'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Author (ORCID)</th>
                <th>Title</th>
                <th>Year</th>
                <th>Type</th>
                <th>Venue</th>
                <th>DOI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={i}>
                  <td><code>{r.author_orcid}</code></td>
                  <td>{r.title}</td>
                  <td>{r.year}</td>
                  <td>{r.type || '—'}</td>
                  <td>{r.journal_or_publisher}</td>
                  <td>{r.doi ? <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">{r.doi}</a> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{opacity:.7,marginTop:8}}>
            Showing {filtered.length} items (de-duplicated by DOI, then title+year).
          </p>
        </div>
      ) : (
        <p style={{opacity:.8}}>{loading ? 'Fetching…' : 'Enter ORCIDs and click Fetch.'}</p>
      )}
    </div>
  );
}

