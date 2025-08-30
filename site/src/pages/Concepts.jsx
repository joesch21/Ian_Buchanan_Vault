import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Concepts() {
  const [concepts, setConcepts] = useState([]);
  const [saving, setSaving] = useState(false);
  const isProd = import.meta.env.PROD;

  useEffect(() => {
    fetch('/api/concepts').then(r => r.json()).then(setConcepts).catch(()=>setConcepts([]));
  }, []);

  function addConcept() {
    setConcepts(c => [...c, { term:'', aliases:[], definition:'', seed_quotes:[], tags:[] }]);
  }

  async function save() {
    if (isProd) { alert('Saving disabled on production build.'); return; }
    setSaving(true);
    const resp = await fetch('/api/concepts', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(concepts)
    });
    setSaving(false);
    if (resp.ok) alert('Saved (dev). In production, use GitHub/Blob for persistence.');
    else alert('Save failed.');
  }

  return (
    <div style={{padding:'2rem', maxWidth: 900}}>
      <h1>Concepts (Glossary Manager)</h1>
      <p>
        <Link to="/concepts/compare">Open Concept Comparer</Link>
      </p>

      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={th}>Term</th>
            <th style={th}>Aliases (comma)</th>
            <th style={th}>Definition</th>
            <th style={th}>Tags (comma)</th>
          </tr>
        </thead>
        <tbody>
          {concepts.map((c, i) => (
            <tr key={i} style={{borderBottom:'1px solid #ddd'}}>
              <td style={td}>
                <input style={input} value={c.term} onChange={e=>update(i,'term',e.target.value)} />
              </td>
              <td style={td}>
                <input style={input} value={(c.aliases||[]).join(', ')} onChange={e=>update(i,'aliases', splitCSV(e.target.value))} />
              </td>
              <td style={td}>
                <textarea style={{...input, height:70}} value={c.definition||''} onChange={e=>update(i,'definition',e.target.value)} />
              </td>
              <td style={td}>
                <input style={input} value={(c.tags||[]).join(', ')} onChange={e=>update(i,'tags', splitCSV(e.target.value))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button className="btn" onClick={addConcept}>Add Concept</button>
        <button className="btn primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save (dev only)'}</button>
      </div>
      <p style={{opacity:.7, marginTop:8}}>
        Writes are disabled on production (Vercel read-only FS). For prod persistence, wire GitHub API or Vercel Blob/KV.
      </p>
    </div>
  );

  function update(i, key, val) {
    setConcepts(cs => {
      const copy = [...cs];
      copy[i] = {...copy[i], [key]: val};
      return copy;
    });
  }
}

const th = { textAlign:'left', padding:'8px' };
const td = { padding:'8px', verticalAlign:'top' };
const input = { width:'100%', padding:'6px', fontFamily:'inherit' };

function splitCSV(s) {
  return s.split(',').map(x => x.trim()).filter(Boolean);
}
