import { useEffect, useState } from 'react';
import Papa from 'papaparse';

function emptyConcept() {
  return { term:'', aliases:[], definition:'', notes:'', seed_quotes:[], tags:[] };
}

export default function Concepts() {
  const [rows, setRows] = useState([]);

  useEffect(() => { fetch('/api/concepts').then(r=>r.json()).then(setRows); }, []);

  const update = (idx, field, value) => {
    setRows(r => r.map((c,i) => i===idx ? { ...c, [field]: value } : c));
  };

  const updateAliases = (idx, val) => update(idx, 'aliases', val.split(',').map(s=>s.trim()).filter(Boolean));
  const updateTags = (idx, val) => update(idx, 'tags', val.split(',').map(s=>s.trim()).filter(Boolean));
  const updateSeed = (idx, val) => {
    const arr = val.split('\n').map(line => {
      const [text='',source='',year='',url=''] = line.split('~~');
      return { text:text.trim(), source:source.trim(), year:year.trim(), url:url.trim() };
    }).filter(q => q.text);
    update(idx, 'seed_quotes', arr);
  };

  const addRow = () => setRows(r => r.concat([emptyConcept()]));
  const delRow = (idx) => setRows(r => r.filter((_,i) => i!==idx));

  const save = async () => {
    await fetch('/api/concepts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(rows)
    });
  };

  const exportCSV = () => {
    const data = rows.map(c => ({
      term: c.term,
      aliases: c.aliases.join('|'),
      definition: c.definition,
      notes: c.notes,
      seed_quotes: c.seed_quotes.map(q => [q.text,q.source,q.year,q.url].join('~~')).join('|'),
      tags: c.tags.join('|')
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'concepts.csv'; a.click();
    URL.revokeObjectURL(a.href);
  };

  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: ({ data }) => {
        const mapped = data.filter(r => r.term).map(r => ({
          term: r.term.trim(),
          aliases: (r.aliases||'').split('|').map(s=>s.trim()).filter(Boolean),
          definition: r.definition || '',
          notes: r.notes || '',
          seed_quotes: (r.seed_quotes||'').split('|').filter(Boolean).map(line => {
            const [text='',source='',year='',url=''] = line.split('~~');
            return { text:text.trim(), source:source.trim(), year:year.trim(), url:url.trim() };
          }),
          tags: (r.tags||'').split('|').map(s=>s.trim()).filter(Boolean)
        }));
        setRows(mapped);
      }
    });
  };

  return (
    <div className="container">
      <h2>Concepts</h2>
      <div style={{marginBottom: '1rem', display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="button" onClick={addRow}>Add</button>
        <button className="button" onClick={save}>Save</button>
        <button className="button" onClick={exportCSV}>Export CSV</button>
        <label className="button"><input type="file" accept=".csv" onChange={importCSV} style={{display:'none'}} />Import CSV</label>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Term</th>
            <th>Aliases</th>
            <th>Definition</th>
            <th>Notes</th>
            <th>Seed Quotes (text~~source~~year~~url per line)</th>
            <th>Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c,idx) => (
            <tr key={idx}>
              <td><input value={c.term} onChange={e=>update(idx,'term',e.target.value)} /></td>
              <td><input value={c.aliases.join(', ')} onChange={e=>updateAliases(idx,e.target.value)} /></td>
              <td><input value={c.definition} onChange={e=>update(idx,'definition',e.target.value)} /></td>
              <td><textarea value={c.notes} onChange={e=>update(idx,'notes',e.target.value)} /></td>
              <td><textarea value={c.seed_quotes.map(q=>[q.text,q.source,q.year,q.url].join('~~')).join('\n')} onChange={e=>updateSeed(idx,e.target.value)} /></td>
              <td><input value={c.tags.join(', ')} onChange={e=>updateTags(idx,e.target.value)} /></td>
              <td><button className="button" onClick={()=>delRow(idx)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
