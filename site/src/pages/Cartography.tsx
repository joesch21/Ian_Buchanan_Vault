import React from "react";
import CartographyAsk from "@/components/CartographyAsk";
import NodeInfo from "@/components/NodeInfo";
import { compileCartography } from "@/lib/cartography";
import { renderForceGraph } from "@/lib/graphRender";
import seedSpec from "@/tests/fixtures/spec.seed.json";
import "@/styles/graph.css";
import { KnowClient } from "@/lib/knowClient";

const client = new KnowClient();

export default function Cartography() {
  const [notice, setNotice] = React.useState("");
  const [graph, setGraph] = React.useState(null as any);
  const [spec, setSpec] = React.useState<any>(null);
  const [selected, setSelected] = React.useState<any>(null);
  const [groups, setGroups] = React.useState<any[]>([]);
  const [groupName, setGroupName] = React.useState("");
  const [scholars, setScholars] = React.useState<string[]>([]);
  const [allScholars, setAllScholars] = React.useState<string[]>([]);

  React.useEffect(() => {
    let alive = true;
    client.groups()
      .then(({ groups }) => {
        if (!alive) return;
        const list = Object.entries(groups).map(([name, meta]: any) => ({
          name,
          members: meta.members || [],
          slug: meta.slug,
          description: meta.description || ""
        }));
        setGroups(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function loadGroup(name: string) {
    try {
      const { scholars: full } = await client.groupDetail(name);
      const names = full.map((s: any) => s.name);
      setScholars(names);
      setAllScholars(prev => {
        const set = new Set([...(prev || []), ...names]);
        return Array.from(set);
      });
    } catch (e) {
      console.error("loadGroup:", e);
      alert(`Failed to load group: ${name}`);
    }
  }

  async function compileAndRender(s:any) {
    try {
      setNotice("Compiling…");
      const gj = await compileCartography(s);
      setNotice("");
      setGraph(gj);
    } catch (e:any) {
      setNotice(String(e));
    }
  }

  async function onSpec(s:any) {
    const specWithScholars = scholars.length ? { ...s, scholars } : s;
    setSpec(specWithScholars);
    await compileAndRender(specWithScholars);
  }

  React.useEffect(() => {
    if (!graph) return;
    const el = document.getElementById("graph-canvas");
    return renderForceGraph(el as HTMLElement, graph.nodes, graph.edges, {
      onNodeClick: (node:any) => setSelected(node)
    });
  }, [graph]);

  return (
    <div className="page">
      <h1>Scholarly Cartography</h1>
      <p>Describe what you want to map; the AI compiles a cartography and we render it as a graph.</p>
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="group">Load Group:&nbsp;</label>
        <select id="group" value={groupName} onChange={(e) => setGroupName(e.target.value)}>
          <option value="">— Select a group —</option>
          {groups.map(g => (
            <option key={g.name} value={g.name}>{g.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => groupName && loadGroup(groupName)}
          disabled={!groupName}
          style={{ marginLeft: 8 }}
        >
          Load
        </button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="scholars">Scholars:&nbsp;</label>
        <select
          id="scholars"
          multiple
          value={scholars}
          onChange={(e) => setScholars(Array.from(e.target.selectedOptions).map(o => o.value))}
        >
          {allScholars.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <CartographyAsk onSpec={onSpec} />
      <button
        className="btn btn-secondary"
        onClick={() => {
          setSpec(seedSpec);
          compileAndRender(seedSpec);
        }}
      >
        Load Example
      </button>
      {notice && <div className="note">{notice}</div>}
      <div id="graph-canvas" style={{minHeight:480, marginTop:12, border:"1px solid #eee", borderRadius:8}} />
      {graph && <RefsDrawer refs={graph.refs} />}
      {selected && (
        <NodeInfo node={selected} refsByCode={graph?.refs || {}} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function RefsDrawer({ refs }: { refs: Record<string, any[]> }) {
  const codes = Object.keys(refs).filter(k => refs[k].length);
  if (!codes.length) return null;
  return (
    <details open style={{marginTop:12}}>
      <summary><b>References by code</b></summary>
      {codes.map(code => (
        <div key={code} style={{marginTop:8}}>
          <div style={{fontWeight:700}}>{code}</div>
          <ul>
            {refs[code].map((r,i) => (
              <li key={i}>
                <a href={r.url || `https://doi.org/${r.doi}`} target="_blank" rel="noopener">
                  {r.title}{r.year ? ` (${r.year})` : ""}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </details>
  );
}
