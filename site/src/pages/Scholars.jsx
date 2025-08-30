import { useEffect, useState } from 'react';
import Papa from 'papaparse';

export default function Scholars() {
  const [scholars, setScholars] = useState([]);
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    fetch('/api/scholars')
      .then(r => r.ok ? r.json() : [])
      .then(setScholars)
      .catch(() => setScholars([]));
  }, []);

  function updateField(i, key, value) {
    const copy = [...scholars];
    copy[i] = { ...copy[i], [key]: value };
    setScholars(copy);
  }

  function addScholar() {
    setScholars([...scholars, { name: '', orcid: '' }]);
  }

  function saveChanges() {
    fetch('/api/scholars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scholars)
    }).then(() => alert('Saved!'));
  }

  function exportCSV() {
    const csv = Papa.unparse(scholars, { columns: ['name', 'orcid'] });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'scholars.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function parseRows(data) {
    const rows = (data || []).map(r => ({
      name: r.name || '',
      orcid: r.orcid || ''
    })).filter(r => r.name);
    setScholars(rows);
  }

  function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => parseRows(res.data)
    });
  }

  function importCSVText() {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => parseRows(res.data)
    });
  }

  return (
    <div style={{padding:'2rem'}}>
      <h1>Scholars Settings</h1>
      <table>
        <thead><tr><th>Name</th><th>ORCID</th></tr></thead>
        <tbody>
          {scholars.map((s,i) => (
            <tr key={i} style={{opacity: s.orcid ? 1 : 0.5}}>
              <td>
                <input
                  value={s.name}
                  onChange={e=>updateField(i,'name',e.target.value)}
                />
              </td>
              <td>
                <input
                  value={s.orcid || ''}
                  placeholder="TBD"
                  onChange={e=>updateField(i,'orcid',e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
        <button onClick={saveChanges}>Save Changes</button>
        <button onClick={addScholar}>Add Scholar</button>
        <button onClick={exportCSV}>Export CSV</button>
        <input type="file" accept=".csv" onChange={importCSV} />
        <textarea
          placeholder="Paste CSV here"
          value={csvText}
          onChange={e=>setCsvText(e.target.value)}
          rows={3}
          style={{width:'100%'}}
        />
        <button onClick={importCSVText}>Import CSV Text</button>
      </div>
    </div>
  );
}
