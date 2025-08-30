import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Concepts() {
  const [concepts, setConcepts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/concepts').then(r => r.json()).then(setConcepts).catch(()=>setConcepts([]));
  }, []);

  function addConcept() {
    setConcepts(c => [...c, { term:'', aliases:[], definition:'', seed_quotes:[], tags:[] }]);
  }

  async function save() {
    setSaving(true);
    const resp = await fetch('/api/save-config', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind:'concepts', payload: concepts, message:'Update concepts via Concepts UI' })
    });
    setSaving(false);
    const j = await resp.json();
    if (j.ok) alert(`Saved (${j.mode}). ${j.url ? 'Open: '+j.url : ''}`);
    else alert('Save failed: ' + j.error);
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
        <button className="btn primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
      </div>
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
