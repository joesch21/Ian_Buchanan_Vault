import { useEffect, useState } from 'react';

const LATEST_CSV = '/data/author_latest.csv'; // Action writes this alias
const DEFAULT_ORCID = '0000-0003-4864-6495';

export default function Bibliography() {
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('');     // 'orcid-api' | 'csv'
  const [updated, setUpdated] = useState('');   // ISO string
  const [err, setErr] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const orcid = (url.searchParams.get('orcid') || DEFAULT_ORCID).trim();

    // Try live ORCID first
    fetch(`/api/orcid?orcid=${encodeURIComponent(orcid)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(j => {
        if (j?.ok && Array.isArray(j.rows) && j.rows.length) {
          setRows(j.rows);
          setSource('orcid-api');
          setUpdated(j.fetchedAt || new Date().toISOString());
        } else {
          throw new Error('No rows from ORCID API');
        }
      })
      .catch(() => {
        // Fallback: static CSV
        fetch(LATEST_CSV)
          .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
          .then(text => {
            const [head, ...lines] = text.trim().split('\n');
            const headers = head.split(',').map(h => h.replace(/^"|"$/g,''));
            const parsed = lines.map(line => {
              const cols = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
              return headers.reduce((o, h, i) => {
                o[h] = (cols[i] || '').replace(/^"|"$/g,'').replace(/""/g,'"');
                return o;
              }, {});
            });
            setRows(parsed);
            setSource('csv');
            setUpdated('from latest CSV');
          })
          .catch(e => setErr(String(e)));
      });
  }, []);

  if (err) return <div className="container"><p style={{color:'crimson'}}>Failed to load bibliography: {err}</p></div>;
  if (!rows.length) return <div className="container"><p>Loading bibliography…</p></div>;

  // Simple split for future tabs (placeholders)
  const items = rows;
  return (
    <div className="container">
      <h2>Bibliography</h2>

      <p>
        <span className={`badge ${source === 'orcid-api' ? 'ok' : 'warn'}`}>
          Data source: {source === 'orcid-api' ? 'ORCID API' : 'CSV fallback'}
        </span>
        <span style={{marginLeft:8, opacity:.7}}>Last updated: {updated}</span>
      </p>

      <ul>
        {items.map((r, i) => (
          <li key={i}>
            <strong>{r.title || '(untitled)'}</strong>
            {r.year ? ` — ${r.year}` : ''}
            {r.journal_or_publisher ? ` — ${r.journal_or_publisher}` : ''}
            {r.doi && <> — DOI: <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">{r.doi}</a></>}
          </li>
        ))}
      </ul>

      <div style={{marginTop:12, display:'flex', gap:12, flexWrap:'wrap'}}>
        <a className="btn" href="/data/author_latest.csv">Download CSV</a>
        <a className="btn" href="/data/author_latest.md">View Markdown</a>
      </div>
    </div>
  );
}
