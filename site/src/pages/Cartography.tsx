import React from "react";
import CartographyAsk from "@/components/CartographyAsk";
import { compileCartography } from "@/lib/cartography";
import { renderForceGraph } from "@/lib/graphRender";
import seedSpec from "@/tests/fixtures/spec.seed.json";
import "@/styles/graph.css";

export default function Cartography() {
  const [notice, setNotice] = React.useState("");
  const [graph, setGraph] = React.useState(null as any);
  const [spec, setSpec] = React.useState<any>(null);

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
    setSpec(s);
    await compileAndRender(s);
  }

  React.useEffect(() => {
    if (!graph) return;
    const el = document.getElementById("graph-canvas");
    return renderForceGraph(el as HTMLElement, graph.nodes, graph.edges);
  }, [graph]);

  return (
    <div className="page">
      <h1>Scholarly Cartography</h1>
      <p>Describe what you want to map; the AI compiles a cartography and we render it as a graph.</p>
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
