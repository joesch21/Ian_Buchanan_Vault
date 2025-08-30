import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ConceptCompare() {
  const [concepts, setConcepts] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [concept, setConcept] = useState('');
  const [selOrcids, setSelOrcids] = useState([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [hits, setHits] = useState([]);

  const navigate = useNavigate();

  useEffect(()=>{ fetch('/api/concepts').then(r=>r.json()).then(setConcepts); },[]);
  useEffect(()=>{ fetch('/api/scholars').then(r=>r.json()).then(setScholars); },[]);

  const onCompare = async () => {
    if (!concept || !selOrcids.length) return;
    const params = new URLSearchParams({ concept, orcids: selOrcids.join(',') });
    if (yearMin) params.append('yearMin', yearMin);
    if (yearMax) params.append('yearMax', yearMax);
    const resp = await fetch(`/api/snippets?${params.toString()}`);
    const data = await resp.json();
    setHits(data.hits || []);
  };

  const groups = selOrcids.map(id => ({ id, name: scholars.find(s=>s.orcid===id)?.name || id }));
  const hitsByOrcid = {};
  hits.forEach(h => { if (!hitsByOrcid[h.orcid]) hitsByOrcid[h.orcid] = []; hitsByOrcid[h.orcid].push(h); });

  const copyMarkdown = () => {
    const lines = [`# ${concept}\n`];
    for (const g of groups) {
      lines.push(`## ${g.name}`);
      (hitsByOrcid[g.id]||[]).forEach(h=>{
        const cite = [];
        if (h.work_title) cite.push(`*${h.work_title}*`);
        if (h.year) cite.push(h.year);
        if (h.doi) cite.push(h.doi);
        if (h.url) cite.push(h.url);
        lines.push(`> ${h.snippet}`);
        if (cite.length) lines.push(`> — ${cite.join(', ')}`);
        lines.push('');
      });
    }
    navigator.clipboard.writeText(lines.join('\n'));
  };

  const openGraph = () => {
    navigate(`/graph?orcids=${selOrcids.join(',')}&concept=${encodeURIComponent(concept)}`);
  };

  return (
    <div className="container">
      <h2>Concept Comparer</h2>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem'}}>
        <select value={concept} onChange={e=>setConcept(e.target.value)}>
          <option value="">Select a concept…</option>
          {concepts.map(c => <option key={c.term} value={c.term}>{c.term}</option>)}
        </select>
        <select multiple value={selOrcids} onChange={e=>setSelOrcids(Array.from(e.target.selectedOptions).map(o=>o.value))}>
          {scholars.map(s => <option key={s.orcid} value={s.orcid}>{s.name} — {s.orcid}</option>)}
        </select>
        <input placeholder="Year min" value={yearMin} onChange={e=>setYearMin(e.target.value)} style={{width:80}} />
        <input placeholder="Year max" value={yearMax} onChange={e=>setYearMax(e.target.value)} style={{width:80}} />
        <button className="button" onClick={onCompare}>Compare</button>
        <button className="button" onClick={copyMarkdown}>Copy Markdown</button>
        <button className="button" onClick={openGraph}>Open in Graph</button>
      </div>

      <div style={{display:'flex', gap:16, alignItems:'flex-start'}}>
        {groups.map(g => (
          <div key={g.id} style={{flex:1}}>
            <h3>{g.name}</h3>
            {(hitsByOrcid[g.id] || []).map((h,i) => (
              <div key={i} className="card" style={{marginBottom:'1rem'}}>
                <blockquote>{h.snippet}</blockquote>
                <div className="small-muted">
                  {h.work_title} ({h.year}) {h.doi && <><br/>DOI: <a href={`https://doi.org/${h.doi}`}>{h.doi}</a></>}
                  {h.url && <><br/><a href={h.url}>link</a></>}
                </div>
              </div>
            ))}
            {!(hitsByOrcid[g.id]||[]).length && <div className="card">No matches.</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
