import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ConceptCompare() {
  const [concepts, setConcepts] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [concept, setConcept] = useState('');
  const [selOrcids, setSelOrcids] = useState([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ fetch('/api/concepts').then(r=>r.json()).then(setConcepts); },[]);
  useEffect(()=>{ fetch('/api/scholars').then(r=>r.json()).then(setScholars).catch(()=>setScholars([])); },[]);

  const conceptObj = useMemo(() => concepts.find(c => c.term === concept), [concepts, concept]);

  async function compare() {
    if (!concept || !selOrcids.length) { alert('Pick a concept and at least one scholar'); return; }
    setLoading(true);
    const resp = await fetch('/api/snippets', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        concept,
        aliases: (conceptObj?.aliases || []),
        orcids: selOrcids,
        yearMin: yearMin || undefined,
        yearMax: yearMax || undefined
      })
    });
    const data = await resp.json();
    setResult(data);
    setLoading(false);
  }

  function copyMarkdown() {
    if (!result?.ok) return;
    const grouped = groupByAuthor(result.hits);
    let md = `# ${concept} — Comparative Notes\n\n`;
    (conceptObj?.seed_quotes || []).forEach(q => {
      md += `> “${q.text}”\n>\n> — *${q.source}* (${q.year})\n\n`;
    });
    Object.entries(grouped).forEach(([a, rows]) => {
      md += `## ${a}\n\n`;
      rows.slice(0,3).forEach(r => {
        md += `> “${r.snippet}”\n>\n> — *${r.work_title}* (${r.year}) ${r.doi?`[DOI](${r.doi})`:''}\n\n`;
      });
    });
    navigator.clipboard.writeText(md);
    alert('Copied comparison as Markdown.');
  }

  return (
    <div style={{padding:'2rem'}}>
      <h1>Concept Comparer</h1>
      <p><Link to="/concepts">Manage concepts</Link> · <Link to="/graph">Open graph</Link></p>

      <div style={{display:'grid', gap:10, maxWidth:900}}>
        <label>Concept
          <select value={concept} onChange={e=>setConcept(e.target.value)} style={input}>
            <option value="">Select a concept…</option>
            {concepts.map(c => <option key={c.term} value={c.term}>{c.term}</option>)}
          </select>
        </label>

        <label>Scholars (ORCIDs)
          <select multiple value={selOrcids} onChange={(e)=>setSelOrcids(
            Array.from(e.target.selectedOptions).map(o=>o.value)
          )} style={{...input, minHeight:'7em'}}>
            {scholars.map(s => <option key={s.orcid} value={s.orcid}>{s.name} — {s.orcid}</option>)}
          </select>
        </label>

        <div style={{display:'flex', gap:10}}>
          <label>Year min <input type="number" value={yearMin} onChange={e=>setYearMin(e.target.value)} style={{...input, width:120}}/></label>
          <label>Year max <input type="number" value={yearMax} onChange={e=>setYearMax(e.target.value)} style={{...input, width:120}}/></label>
        </div>

        <div style={{display:'flex', gap:8}}>
          <button className="btn primary" onClick={compare} disabled={loading}>{loading?'Comparing…':'Compare'}</button>
          <button className="btn" onClick={copyMarkdown} disabled={!result?.ok}>Copy Markdown</button>
          {!!selOrcids.length && (
            <Link className="btn" to={`/graph?orcids=${encodeURIComponent(selOrcids.join(','))}`}>
              Open in Graph
            </Link>
          )}
        </div>
      </div>

      {!!conceptObj && (
        <div style={{marginTop:16, opacity:.9}}>
          <h3>Anchor quotes for “{conceptObj.term}”</h3>
          {(conceptObj.seed_quotes||[]).map((q,i)=>(
            <blockquote key={i} style={bq}>
              <p>“{q.text}”</p>
              <footer>— <em>{q.source}</em> ({q.year})</footer>
            </blockquote>
          ))}
        </div>
      )}

      {result?.ok && <Columns hits={result.hits} />}
    </div>
  );
}

function Columns({ hits }) {
  const grouped = groupByAuthor(hits);
  const authors = Object.keys(grouped);
  return (
    <div style={{display:'grid', gap:16, gridTemplateColumns:`repeat(${Math.min(authors.length,4)}, minmax(220px, 1fr))`, marginTop:20}}>
      {authors.map(a => (
        <div key={a} style={{border:'1px solid #ddd', borderRadius:8, padding:'12px'}}>
          <h3 style={{marginTop:0}}>{a}</h3>
          {grouped[a].slice(0,4).map((r,i)=>(
            <blockquote key={i} style={bq}>
              <p>“{r.snippet}”</p>
              <footer>— <em>{r.work_title}</em> ({r.year}) {r.doi ? <a href={`https://doi.org/${r.doi}`} target="_blank">DOI</a> : r.url ? <a href={r.url} target="_blank">Link</a> : null}</footer>
            </blockquote>
          ))}
        </div>
      ))}
    </div>
  );
}

const input = { width:'100%', padding:'6px' };
const bq = { background:'#fafafa', borderLeft:'3px solid #999', margin:0, marginBottom:10, padding:'6px 10px' };

function groupByAuthor(rows) {
  return rows.reduce((acc, r) => {
    const k = r.author || r.orcid;
    acc[k] = acc[k] || [];
    acc[k].push(r);
    return acc;
  }, {});
}
