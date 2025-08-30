import { useEffect, useState } from 'react';
import { fetchOrcidWorks } from '../lib/orcidClient.js';
import { loadWorks, biblioStore } from '../lib/biblioStore.js';
import BiblioFilters from '../components/biblio/BiblioFilters.jsx';
import BiblioList from '../components/biblio/BiblioList.jsx';
import RightRail from '../components/biblio/RightRail.jsx';
import '../styles/biblio.css';

export default function Bibliography(){
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const id = import.meta.env.DEFAULT_ORCID || '0000-0002-1825-0097';
    fetchOrcidWorks(id)
      .then(ws => { loadWorks(ws); setLoading(false); })
      .catch(e => { setErr(String(e)); setLoading(false); });
  }, []);

  if (err) return <p style={{color:'crimson'}}>Failed to load bibliography: {err}</p>;
  if (loading) return <p>Loading bibliography…</p>;

  return (
    <div className="biblio-page">
      <BiblioFilters />
      <div className="biblio-main">
        <BiblioList items={biblioStore.items} />
        <RightRail />
      </div>
    </div>
  );
}
