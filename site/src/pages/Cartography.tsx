import { useEffect, useState } from 'react';
import GraphView, { NODE_COLORS, EDGE_COLORS } from '@/components/GraphView';
import NodeDetails from '@/components/NodeDetails';
import { compileCartography } from '@/lib/api';
import '../styles/carto.css';

const SITE_ID = import.meta.env.VITE_DEFAULT_SITE_ID || 'buchanan-vault';

export default function CartographyPage() {
  const [graph,setGraph] = useState<any|null>(null);
  const [selected,setSelected] = useState<any|null>(null);
  const [query,setQuery] = useState('assemblage affect');
  const [years,setYears] = useState('');
  const [group,setGroup] = useState('');
  const [showAdv,setShowAdv] = useState(false);
  const [warning,setWarning] = useState('');
  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    const cached = sessionStorage.getItem('cartography:last');
    if (cached) setGraph(JSON.parse(cached));
    else explore({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function explore(extra:any){
    setLoading(true);
    try{
      const spec = { query, years, group, siteId: SITE_ID, ...extra };
      const g = await compileCartography(spec);
      setGraph(g);
      sessionStorage.setItem('cartography:last', JSON.stringify(g));
      setWarning('');
    }catch(e:any){
      setWarning(String(e));
    }finally{ setLoading(false); }
  }

  const onSubmit = (e:any)=>{ e.preventDefault(); explore({}); };

  return (
    <div className="cartography-page">
      <form className="prompt-bar" onSubmit={onSubmit}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Explore concepts…" />
        <button type="submit" className="primary">Explore</button>
        <button type="button" onClick={()=>setShowAdv(!showAdv)}>Advanced</button>
        {showAdv && (
          <div className="advanced-pop">
            <div>
              <label>Years <input value={years} onChange={e=>setYears(e.target.value)} placeholder="e.g. 1990-2020" /></label>
            </div>
            <div style={{marginTop:4}}>
              <label>Scholar group <input value={group} onChange={e=>setGroup(e.target.value)} placeholder="e.g. deleuze" /></label>
            </div>
          </div>
        )}
      </form>
      {warning && <div className="warning">{warning}</div>}
      <div className="legend">
        <div className="legend-row">
          <span className="chip" style={{background:NODE_COLORS.concept}}></span>Concept
          {' '}
          <span className="chip" style={{background:NODE_COLORS.scholar}}></span>Scholar
          {' '}
          <span className="chip" style={{background:NODE_COLORS.work}}></span>Work
        </div>
        <div className="legend-row">
          <span className="chip" style={{background:EDGE_COLORS.aligns}}></span>Aligns
          {' '}
          <span className="chip" style={{background:EDGE_COLORS.diverges}}></span>Diverges
          {' '}
          <span className="chip" style={{background:EDGE_COLORS.cites}}></span>Cites
        </div>
      </div>
      <div className="canvas-wrap">
        {loading && <div className="loading">Loading…</div>}
        <GraphView graph={graph} onSelect={setSelected} />
      </div>
      <NodeDetails node={selected} onClose={()=>setSelected(null)} />
    </div>
  );
}
