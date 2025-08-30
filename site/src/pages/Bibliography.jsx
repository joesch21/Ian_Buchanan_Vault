import { useEffect, useState } from 'react';
import { fetchOrcidWorks } from '../lib/orcidClient.js';

const DEFAULT_ORCID = '0000-0003-4864-6495';

export default function Bibliography() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const orcid = (url.searchParams.get('orcid') || DEFAULT_ORCID).trim();
    fetchOrcidWorks(orcid)
      .then(setItems)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <div className="container"><p style={{color:'crimson'}}>Failed to load bibliography: {err}</p></div>;
  if (!items.length) return <div className="container"><p>Loading bibliography…</p></div>;

  return (
    <div className="container">
      <h2>Bibliography</h2>
      <ul>
        {items.map(it => (
          <li key={it.id}>
            <strong>{it.title || '(untitled)'}</strong>
            {it.year ? ` — ${it.year}` : ''}
            {it.venue ? ` — ${it.venue}` : (it.publisher ? ` — ${it.publisher}` : '')}
            {it.doi && <> — DOI: <a href={`https://doi.org/${it.doi}`} target="_blank" rel="noreferrer">{it.doi}</a></>}
            {it.isbn13 && <> — ISBN: {it.isbn13}</>}
          </li>
        ))}
      </ul>
    </div>
  );
}
