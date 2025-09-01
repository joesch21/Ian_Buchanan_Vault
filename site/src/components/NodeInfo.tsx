import React from "react";
import { KnowClient } from "@/lib/knowClient";

type Node = { id:string; type:"author"|"work"|"concept"; label:string; code?:string; year?:number; url?:string; orcid?:string };
type Ref = { title:string; url?:string; doi?:string; year?:number };

export default function NodeInfo({
  node,
  refsByCode,
  onClose
}:{
  node: Node;
  refsByCode: Record<string, Ref[]>;
  onClose: ()=>void;
}) {
  const [busy,setBusy] = React.useState(false);
  const [answer,setAnswer] = React.useState<string>("");
  const [citations,setCitations] = React.useState<{title:string;url?:string}[]>([]);
  const client = new KnowClient();

  // build a tiny context from our graph
  function buildContext() {
    const lines:string[] = [];
    if (node.type === "concept") {
      const code = node.code || "";
      const refs = refsByCode[code] || [];
      if (refs.length) {
        lines.push("Relevant works:");
        for (const r of refs.slice(0,6)) lines.push(`- ${r.title}${r.year?` (${r.year})`: ""}${r.doi?` doi:${r.doi}`:""}`);
      }
    }
    if (node.type === "work" && node.year) lines.push(`Work year: ${node.year}`);
    if (node.type === "author" && node.orcid) lines.push(`Author ORCID: ${node.orcid}`);
    return lines.join("\n");
  }

  async function ask() {
    setBusy(true);
    try {
      const prompt = [
        `Explain "${node.label}" (${node.type}).`,
        `Relate it to Deleuzian usage and Buchanan’s scholarship when applicable.`,
        `Be concise (120–180 words) and define jargon.`,
        `Use the provided "Relevant works" when present and prefer those for citations.`,
        buildContext()
      ].join("\n");
      const res = await client.query(prompt);
      if ("needsTool" in res) setAnswer(res.draft || ""); else setAnswer(res.answer || "");
      setCitations(
        (res.citations || []).slice(0,6)
      );
    } catch (e:any) {
      setAnswer(`(Error) ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  const localRefs = node.type==="concept" ? (refsByCode[node.code || ""] || []) : [];

  return (
    <div className="nodeinfo">
      <div className="ni-head">
        <b>{node.label}</b> <small style={{opacity:.8}}>({node.type})</small>
        <button className="ni-x" onClick={onClose}>×</button>
      </div>

      {node.url && <p><a href={node.url} target="_blank" rel="noreferrer">Open source</a></p>}

      <button className="ni-ask" disabled={busy} onClick={ask}>
        {busy ? "Asking…" : "Ask AI about this"}
      </button>

      {answer && <div className="ni-answer">{answer}</div>}

      {(localRefs.length>0 || citations.length>0) && (
        <div className="ni-refs">
          <div className="ni-sub">Citations</div>
          <ul>
            {localRefs.map((r,i)=>(
              <li key={`lr-${i}`}>
                <a href={r.url || (r.doi ? `https://doi.org/${r.doi}` : "#")} target="_blank" rel="noreferrer">
                  {r.title}{r.year?` (${r.year})`:""}
                </a>
              </li>
            ))}
            {citations.map((c,i)=>(
              <li key={`kc-${i}`}>
                <a href={c.url || "#"} target="_blank" rel="noreferrer">{c.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

