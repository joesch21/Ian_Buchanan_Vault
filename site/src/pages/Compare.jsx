import { useEffect, useState } from 'react';

export default function Compare() {
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/data/compare/summary.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setSummary)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <div className="container"><p style={{color:'crimson'}}>Failed to load comparison: {err}</p></div>;
  if (!summary) return <div className="container"><p>Loading comparison…</p></div>;

  const { years, authors } = summary;
  const filtered = authors.filter(a => a.orcid_id.includes(query.trim()));

  return (
    <div className="container">
      <h2>Author Comparison</h2>
      <p>
        Matrix shows totals and per-year counts for each ORCID ingested.
        Raw CSV: <a href="/data/compare/matrix.csv">matrix.csv</a>
      </p>

      <input
        type="text"
        placeholder="Filter ORCID…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{marginBottom:12,padding:4}}
      />

      <table className="table">
        <thead>
          <tr>
            <th>ORCID</th>
            <th>Total</th>
            {years.map(y => <th key={y}>{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.orcid_id}>
              <td><code>{a.orcid_id}</code></td>
              <td>{a.total}</td>
              {years.map(y => <td key={y}>{a.by_year[y] || 0}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:'1.5rem'}}>Per-author dumps</h3>
      <ul>
        {filtered.map(a => (
          <li key={a.orcid_id}>
            <code>{a.orcid_id}</code> — <a href={`/data/${a.orcid_id}.csv`}>CSV</a> · <a href={`/data/${a.orcid_id}.md`}>MD</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
