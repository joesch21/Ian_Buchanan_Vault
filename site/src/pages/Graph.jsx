import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

// ---------- helpers ----------
const fmt = (x) => (x ?? '').toString();
const norm = (s) => fmt(s).toLowerCase().trim().replace(/\s+/g,' ').replace(/[^\w\s]/g,'');
const workKey = (row) => {
  const doi = fmt(row.doi).toLowerCase();
  return doi ? `doi:${doi}` : `ty:${norm(row.title)}|${fmt(row.year)}`;
};

async function fetchCSV(orcid) {
  const url = `/data/${orcid}.csv`;
  const txt = await fetch(url).then(r => r.ok ? r.text() : Promise.reject(r.statusText));
  const [head, ...lines] = txt.trim().split('\n');
  const headers = head.split(',').map(h => h.replace(/^"|"$/g,''));
  return lines.map(line => {
    const cols = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    const o = {};
    headers.forEach((h,i)=> o[h] = (cols[i]||'').replace(/^"|"$/g,'').replace(/""/g,'"'));
    return o;
  });
}

function buildBipartite(rows, orcids) {
  const nodes = new Map();  // id -> node
  const links = [];
  const ensure = (id, type, label) => {
    if (!nodes.has(id)) nodes.set(id, { id, type, label });
    return nodes.get(id);
  };
  for (const r of rows) {
    const aId = `author:${r.author_orcid}`;
    ensure(aId, 'author', r.author_orcid);
    const wId = `work:${workKey(r)}`;
    ensure(wId, 'work', r.title || '(untitled)');
    links.push({ source: aId, target: wId, title: r.title || '', year: r.year || '' });
  }
  // Ensure all requested authors exist as nodes even if a dataset is empty
  for (const id of orcids) ensure(`author:${id}`, 'author', id);
  return { nodes: Array.from(nodes.values()), links };
}

function buildAuthorCoWork(rows, orcids) {
  const byWork = new Map(); // key -> Set(author)
  for (const r of rows) {
    const k = workKey(r);
    if (!byWork.has(k)) byWork.set(k, new Set());
    byWork.get(k).add(r.author_orcid);
  }
  const weight = new Map(); // "a|b" -> count
  const authors = new Set(orcids);
  for (const set of byWork.values()) {
    const arr = Array.from(set);
    arr.forEach(a => authors.add(a));
    for (let i=0;i<arr.length;i++){
      for (let j=i+1;j<arr.length;j++){
        const [x,y] = [arr[i],arr[j]].sort();
        const key = `${x}|${y}`;
        weight.set(key, (weight.get(key)||0)+1);
      }
    }
  }
  const nodes = Array.from(authors).map(a => ({ id:`author:${a}`, type:'author', label:a }));
  const links = Array.from(weight.entries()).map(([key,w]) => {
    const [x,y] = key.split('|');
    return { source:`author:${x}`, target:`author:${y}`, weight:w };
  });
  return { nodes, links };
}

function useContainerSize(ref) {
  const [size, setSize] = useState({ w: 800, h: 520 });
  useEffect(() => {
    function onResize(){
      const el = ref.current?.parentElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(320, rect.width), h: Math.max(400, 0.6*rect.width) });
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [ref]);
  return size;
}

// ---------- page ----------
export default function Graph() {
  const [orcids, setOrcids] = useState('');
  const [mode, setMode] = useState('bipartite'); // 'bipartite' | 'cowork'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,setError] = useState('');

  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const { w, h } = useContainerSize(wrapRef);

  const orcidList = useMemo(
    () => orcids.split(',').map(s=>s.trim()).filter(Boolean),
    [orcids]
  );

  const graph = useMemo(() => {
    if (!orcidList.length) return { nodes:[], links:[] };
    if (!rows.length)      return { nodes:[], links:[] };
    return mode === 'bipartite'
      ? buildBipartite(rows, orcidList)
      : buildAuthorCoWork(rows, orcidList);
  }, [rows, mode, orcidList]);

  async function fetchAll() {
    try {
      setLoading(true); setError(''); setRows([]);
      const ids = orcidList;
      if (!ids.length) throw new Error('Enter at least one ORCID.');
      let all = [];
      for (const id of ids) {
        // 1) Prefer CSV if present
        const csvRows = await fetchCSV(id).catch(()=>null);
        if (csvRows && csvRows.length) {
          all = all.concat(csvRows.map(r => ({ ...r, author_orcid:id })));
          continue;
        }
        // 2) Fallback: live API
        try {
          const j = await fetch(`/api/orcid?orcid=${encodeURIComponent(id)}`).then(r=>r.json());
          if (j?.ok && Array.isArray(j.rows)) {
            const mapped = j.rows.map(r => ({
              author_orcid:id,
              title:r.title||'', year:r.year||'', type:r.type||'',
              journal_or_publisher:r.journal_or_publisher||'', doi:r.doi||'', url:r.url||''
            }));
            all = all.concat(mapped);
          }
        } catch { /* skip one author */ }
      }
      setRows(all);
    } catch(e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // D3 render (stable)
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = graph.nodes || [];
    const links = graph.links || [];
    if (!nodes.length) {
      svg.attr('viewBox', [0,0,w,h]).attr('width','100%').attr('height', h);
      return;
    }

    svg.attr('viewBox', [0,0,w,h]).attr('width','100%').attr('height', h);

    const g = svg.append('g');

    // Background canvas (prevents “disappear”)
    g.append('rect')
      .attr('width', w)
      .attr('height', h)
      .attr('fill', '#f6f6f6');

    // Zoom/pan (capped)
    svg.call(
      d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (e) => g.attr('transform', e.transform))
    );

    const link = g.append('g')
      .attr('stroke', '#cfd3d7')
      .attr('stroke-opacity', 0.8)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', d => Math.max(1, d.weight ? Math.sqrt(d.weight) : 1));

    const color = (d) => d.type === 'author' ? '#1f77b4' : '#8c8c8c';
    const radius = (d) => d.type === 'author' ? 8 : 5;

    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', radius)
      .attr('fill', color)
      .attr('stroke','#fff')
      .attr('stroke-width',1.2)
      .call(d3.drag()
        .on('start', (event,d)=>{ if(!event.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag', (event,d)=>{ d.fx=event.x; d.fy=event.y; })
        .on('end', (event,d)=>{ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
      );

    node.append('title').text(d => d.label);

    // Force simulation — faster cooling + stop after settle
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d=>d.id)
        .distance(d=> d.weight ? 120/Math.sqrt(d.weight) : (graph.links?.length > 600 ? 40 : 60))
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(w/2, h/2))
      .force('collide', d3.forceCollide().radius(d=>radius(d)+4))
      .alpha(1)
      .alphaDecay(0.05)   // cool faster
      .alphaMin(0.02);    // stop earlier

    const ticked = () => {
      node.attr('cx', d=>d.x).attr('cy', d=>d.y);
      link
        .attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
    };

    sim.on('tick', ticked);
    sim.on('end', () => {
      // Freeze final layout to avoid drift during page scrolls
      sim.stop();
    });

    // Safety: stop after 6s even if not settled
    const kill = setTimeout(() => sim.stop(), 6000);

    // Re-center on container size changes
    const ro = new ResizeObserver(() => {
      sim.force('center', d3.forceCenter(w/2, h/2));
      sim.alpha(0.2).restart();
      setTimeout(() => sim.stop(), 1500);
    });
    ro.observe(svgRef.current);

    return () => {
      clearTimeout(kill);
      ro.disconnect();
      sim.stop();
    };
  }, [graph, w, h]);

  function useExamples() {
    const examples = [
      '0000-0003-4864-6495', // Buchanan
      '0000-0001-2345-6789', // placeholder — replace with a real ORCID
      '0000-0002-9876-5432'  // placeholder — replace with a real ORCID
    ].join(', ');
    setOrcids(examples);
    fetchAll();
  }

  return (
    <div className="container" ref={wrapRef}>
      <h2>Rhizome Graph</h2>
      <div style={{display:'grid',gap:10,marginBottom:12}}>
        <label>
          ORCIDs (comma-separated)
          <input
            style={{width:'100%',padding:'8px',marginTop:6}}
            placeholder="0000-0003-4864-6495, 0000-0001-2345-6789"
            value={orcids}
            onChange={e=>setOrcids(e.target.value)}
          />
        </label>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <button className="btn primary" onClick={fetchAll} disabled={loading}>{loading ? 'Loading…' : 'Build graph'}</button>
          <button className="btn" type="button" onClick={useExamples}>Use examples</button>
          <span style={{marginLeft:8}}>
            Mode:
              <label style={{marginLeft:8}}>
                <input type="radio" name="mode" value="bipartite" checked={mode==='bipartite'} onChange={()=>setMode('bipartite')} /> Bipartite (Author–Work)
              </label>
              <label style={{marginLeft:12}}>
                <input type="radio" name="mode" value="cowork" checked={mode==='cowork'} onChange={()=>setMode('cowork')} /> Author Co-work
              </label>
            </span>
        </div>
        {error && <p style={{color:'crimson'}}>Error: {error}</p>}
      </div>

      <svg ref={svgRef} role="img" aria-label="Rhizome graph" />
      <p style={{opacity:.7,marginTop:8}}>
        Tip: drag nodes to adjust; pinch/scroll to zoom (0.5×–3×). Layout settles automatically.
      </p>
    </div>
  );
}
