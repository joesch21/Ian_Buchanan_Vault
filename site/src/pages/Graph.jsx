import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

// ---------- helpers ----------
const fmt = (x) => (x ?? '').toString();
const norm = (s) => fmt(s).toLowerCase().trim().replace(/\s+/g,' ').replace(/[^\w\s-]/g,''); // keep hyphens for terms
const workKey = (row) => {
  const doi = fmt(row.doi).toLowerCase();
  return doi ? `doi:${doi}` : `ty:${norm(row.title)}|${fmt(row.year)}`;
};

async function fetchCSV(orcid) {
  const url = `/data/${orcid}.csv`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('csv not found');
  const txt = await resp.text();
  const [head, ...lines] = txt.trim().split('\n');
  const headers = head.split(',').map(h => h.replace(/^"|"$/g,''));
  return lines.map(line => {
    const cols = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    const o = {};
    headers.forEach((h,i)=> o[h] = (cols[i]||'').replace(/^"|"$/g,'').replace(/""/g,'"'));
    o.author_orcid = o.author_orcid || orcid;
    return o;
  });
}

// --- concept extraction (naïve but effective) ---
const STOP = new Set([
  'and','or','the','a','an','of','in','on','for','to','with','without','by','from','into','as','at','about',
  'is','are','was','were','be','being','been','this','that','these','those','it','its','their','his','her',
  'toward','towards','between','across','over','under','after','before','against','through','per',
  'note','editorial','introduction','volume','review','special','issue','journal','press','university',
  'de','la','le','et','du','des'
]);

function extractConcepts(title, venue) {
  const text = `${fmt(title)} ${fmt(venue)}`.toLowerCase();
  // keep hyphenated terms, remove punctuation except hyphen
  const tokens = norm(text).split(/\s+/).filter(Boolean);
  const onegrams = tokens.filter(t => t.length > 2 && !STOP.has(t));
  // simple bigrams for phrases like "assemblage theory"
  const bigrams = [];
  for (let i=0;i<tokens.length-1;i++){
    const a=tokens[i], b=tokens[i+1];
    if (a.length>2 && b.length>2 && !STOP.has(a) && !STOP.has(b)) bigrams.push(`${a} ${b}`);
  }
  return [...onegrams, ...bigrams];
}

function tallyConcepts(rows) {
  const counts = new Map(); // concept -> {count, works:Set(workId)}
  for (const r of rows) {
    const wk = workKey(r);
    const terms = extractConcepts(r.title, r.journal_or_publisher);
    const uniq = new Set(terms); // avoid double-counting within same work
    for (const t of uniq) {
      const c = counts.get(t) || { count:0, works:new Set() };
      c.count += 1; c.works.add(wk);
      counts.set(t, c);
    }
  }
  return counts;
}

// ---------- graph builders ----------
function buildBipartite(rows) {
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
    links.push({ source: aId, target: wId, title: r.title || '(untitled)', year: r.year || '' });
  }
  return { nodes: [...nodes.values()], links };
}

function buildAuthorCoWork(rows) {
  const byWork = new Map(); // workKey -> Set(author)
  for (const r of rows) {
    const k = workKey(r);
    if (!byWork.has(k)) byWork.set(k, new Set());
    byWork.get(k).add(r.author_orcid);
  }
  const authors = new Set();
  const weight = new Map(); // "a|b" -> count
  for (const set of byWork.values()) {
    const arr = [...set];
    arr.forEach(a => authors.add(a));
    for (let i=0;i<arr.length;i++){
      for (let j=i+1;j<arr.length;j++){
        const [x,y] = [arr[i],arr[j]].sort();
        const key = `${x}|${y}`;
        weight.set(key, (weight.get(key) || 0) + 1);
      }
    }
  }
  const nodes = [...authors].map(a => ({ id:`author:${a}`, type:'author', label:a }));
  const links = [...weight.entries()].map(([key,w]) => {
    const [x,y] = key.split('|');
    return { source:`author:${x}`, target:`author:${y}`, weight:w };
  });
  return { nodes, links };
}

// NEW: tripartite builder
function buildTripartite(rows, minConceptFreq = 2, yearMin = -Infinity, yearMax = Infinity, focusOrcid = '') {
  const nodes = new Map();  // id -> node
  const links = [];

  // Year filter up-front
  const filteredRows = rows.filter(r => {
    const y = Number(r.year);
    return Number.isFinite(y) ? (y >= yearMin && y <= yearMax) : true;
  });

  // Concept tally
  const counts = tallyConcepts(filteredRows);
  const allowedConcepts = new Set([...counts.entries()]
    .filter(([,v]) => v.count >= minConceptFreq)
    .map(([k]) => k)
  );

  const ensure = (id, type, label) => {
    if (!nodes.has(id)) nodes.set(id, { id, type, label });
    return nodes.get(id);
  };

  for (const r of filteredRows) {
    const aId = `author:${r.author_orcid}`;
    const wId = `work:${workKey(r)}`;
    const title = r.title || '(untitled)';

    // nodes
    ensure(aId, 'author', r.author_orcid);
    ensure(wId, 'work', title);

    // edges: author -> work
    links.push({ source: aId, target: wId, year: r.year || '' });

    // edges: work -> concept (filtered)
    const terms = extractConcepts(r.title, r.journal_or_publisher);
    const uniq = new Set(terms);
    for (const t of uniq) {
      if (!allowedConcepts.has(t)) continue;
      const cId = `concept:${t}`;
      ensure(cId, 'concept', t);
      links.push({ source: wId, target: cId });
    }
  }

  // mark focused author's neighborhood
  if (focusOrcid) {
    const aid = `author:${focusOrcid}`;
    const mark = new Set([aid]);
    // include immediate neighbors
    links.forEach(l => {
      if (l.source === aid) mark.add(l.target);
      if (l.target === aid) mark.add(l.source);
    });
    // add second-degree (works -> concepts)
    links.forEach(l => { if (mark.has(l.source)) mark.add(l.target); if (mark.has(l.target)) mark.add(l.source); });
    // tag nodes
    nodes.forEach(n => { n.focus = mark.has(n.id); });
  }

  return { nodes: [...nodes.values()], links };
}

function useResize(elRef) {
  const [size, setSize] = useState({ w: 960, h: 560 });
  useEffect(() => {
    const onResize = () => {
      const el = elRef.current?.parentElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(320, rect.width), h: Math.max(360, Math.min(700, rect.height || 560)) });
    };
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [elRef]);
  return size;
}

// ---------- component ----------
export default function Graph() {
  const [orcids, setOrcids] = useState('');
  const [mode, setMode] = useState('bipartite'); // 'bipartite' | 'cowork' | 'tripartite'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,setError] = useState('');
  const [minFreq, setMinFreq] = useState(2);
  const [focusOrcid, setFocusOrcid] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');

  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const resizeRef = useRef(null);
  const { w, h } = useResize(wrapRef);

  const graph = useMemo(() => {
    if (!rows.length) return { nodes:[], links:[] };
    if (mode === 'bipartite') return buildBipartite(rows);
    if (mode === 'cowork')    return buildAuthorCoWork(rows);
    // tripartite
    const yMin = Number(yearMin); const yMax = Number(yearMax);
    const ym = Number.isFinite(yMin) ? yMin : -Infinity;
    const yx = Number.isFinite(yMax) ? yMax : Infinity;
    return buildTripartite(rows, Number(minFreq) || 2, ym, yx, focusOrcid.trim());
  }, [rows, mode, minFreq, focusOrcid, yearMin, yearMax]);

  async function fetchAll() {
    try {
      setLoading(true); setError(''); setRows([]);
      const ids = orcids.split(',').map(s=>s.trim()).filter(Boolean);
      if (!ids.length) throw new Error('Enter at least one ORCID.');
      let all = [];
      for (const id of ids) {
        try {
          const csvRows = await fetchCSV(id).catch(()=>null);
          if (csvRows?.length) {
            all = all.concat(csvRows);
          } else {
            const j = await fetch(`/api/orcid?orcid=${encodeURIComponent(id)}`).then(r=>r.json());
            if (j?.ok && Array.isArray(j.rows)) {
              const mapped = j.rows.map(r => ({
                author_orcid:id,
                title:r.title||'', year:r.year||'', type:r.type||'',
                journal_or_publisher:r.journal_or_publisher||'', doi:r.doi||'', url:r.url||''
              }));
              all = all.concat(mapped);
            }
          }
        } catch { /* skip one author on failure */ }
      }
      setRows(all);
    } catch(e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // D3 rendering — stabilized (from VIZ-002)
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, links } = graph;
    svg.attr('viewBox', [0, 0, w, h]).attr('width', '100%').attr('height', h);

    const g = svg.append('g');

    // background so it never "disappears"
    g.append('rect').attr('width', w).attr('height', h).attr('fill', '#fafafa');

    // zoom/pan — capped for stability
    const zoom = d3.zoom().scaleExtent([0.5, 3]).on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    if (!nodes.length) return;

    const link = g.append('g')
      .attr('stroke', '#cfcfd6').attr('stroke-opacity', 0.8)
      .selectAll('line').data(links).enter().append('line')
      .attr('stroke-width', d => Math.max(1, d.weight ? Math.sqrt(d.weight) : 1));

    const color = (d) => d.type === 'author' ? '#1f77b4' : d.type === 'concept' ? '#b8860b' : '#6e6e6e';
    const radius = (d) => d.type === 'author' ? 8 : d.type === 'concept' ? 7 : 5;
    const stroke  = (d) => d.focus ? '#111' : '#fff';
    const strokeW = (d) => d.focus ? 2 : 1.2;

    const nodeG = g.append('g')
      .selectAll('circle').data(nodes).enter().append('circle')
      .attr('r', radius).attr('fill', color).attr('stroke', stroke).attr('stroke-width', strokeW)
      .call(d3.drag()
        .on('start', (event,d)=>{ if(!event.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag', (event,d)=>{ d.fx=event.x; d.fy=event.y; })
        .on('end',   (event,d)=>{ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
      );

    nodeG.append('title').text(d => d.label);

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d=>d.id)
        .distance(d=> d.weight ? 120/Math.sqrt(d.weight) : (d.target?.type==='concept' || d.source?.type==='concept') ? 80 : 60)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w/2, h/2))
      .force('collide', d3.forceCollide().radius(d=>radius(d)+4))
      .alpha(1).alphaDecay(0.05);

    sim.on('tick', () => {
      nodeG.attr('cx', d=>d.x).attr('cy', d=>d.y);
      link
        .attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
    });

    // re-center on resize
    resizeRef.current = () => {
      sim.force('center', d3.forceCenter(w/2, h/2));
      sim.alpha(0.3).restart();
      setTimeout(()=> sim.alphaTarget(0), 400);
    };

    const onVis = () => {
      if (document.hidden) { sim.alphaTarget(0); }
      else { sim.alpha(0.2).restart(); setTimeout(()=> sim.alphaTarget(0), 500); }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => { document.removeEventListener('visibilitychange', onVis); sim.stop(); };
  }, [graph, w, h]);

  // Kick re-center when container size changes
  useEffect(() => { resizeRef.current?.(); }, [w, h]);

  function useExamples() {
    const examples = [
      '0000-0003-4864-6495',
      '0000-0001-2345-6789',
      '0000-0002-9876-5432'
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
          <button className="btn primary" onClick={fetchAll} disabled={loading}>
            {loading ? 'Loading…' : 'Build graph'}
          </button>
          <button className="btn" type="button" onClick={useExamples}>Use examples</button>
          <span style={{marginLeft:8}}>
            Mode:
            <label style={{marginLeft:8}}>
              <input type="radio" name="mode" value="bipartite" checked={mode==='bipartite'} onChange={()=>setMode('bipartite')} /> Bipartite (Author–Work)
            </label>
            <label style={{marginLeft:12}}>
              <input type="radio" name="mode" value="cowork" checked={mode==='cowork'} onChange={()=>setMode('cowork')} /> Author Co-work
            </label>
            <label style={{marginLeft:12}}>
              <input type="radio" name="mode" value="tripartite" checked={mode==='tripartite'} onChange={()=>setMode('tripartite')} /> Tripartite (Scholar–Work–Concept)
            </label>
          </span>
        </div>

        {mode === 'tripartite' && (
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
            <label>Min concept freq
              <input type="range" min="1" max="10" step="1" value={minFreq} onChange={(e)=>setMinFreq(e.target.value)} style={{marginLeft:8}} />
              <span style={{marginLeft:6}}>{minFreq}</span>
            </label>
            <label style={{marginLeft:12}}>Year min
              <input type="number" value={yearMin} onChange={(e)=>setYearMin(e.target.value)} style={{width:90,marginLeft:6,padding:'4px 6px'}} placeholder="e.g. 2000"/>
            </label>
            <label style={{marginLeft:12}}>Year max
              <input type="number" value={yearMax} onChange={(e)=>setYearMax(e.target.value)} style={{width:90,marginLeft:6,padding:'4px 6px'}} placeholder="e.g. 2025"/>
            </label>
            <label style={{marginLeft:12}}>Highlight ORCID
              <input value={focusOrcid} onChange={(e)=>setFocusOrcid(e.target.value)} style={{width:220,marginLeft:6,padding:'4px 6px'}} placeholder="0000-0003-4864-6495"/>
            </label>
            <span style={{marginLeft:12,opacity:.7}}>
              Legend: <span style={{color:'#1f77b4'}}>● Author</span> · <span style={{color:'#6e6e6e'}}>● Work</span> · <span style={{color:'#b8860b'}}>● Concept</span>
            </span>
          </div>
        )}

        {error && <p style={{color:'crimson'}}>Error: {error}</p>}
      </div>

      <svg ref={svgRef} role="img" aria-label="Rhizome graph" />
      <p style={{opacity:.7,marginTop:8}}>
        Tip: drag nodes to adjust; pinch/scroll to zoom. Layout settles automatically. In Tripartite mode, raise “Min concept freq” to de-noise.
      </p>
    </div>
  );
}

