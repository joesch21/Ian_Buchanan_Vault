import * as React from "react";
import { KnowClient } from "@/lib/knowClient";

const client = new KnowClient();

export default function ReadingListPage() {
  const [group, setGroup] = React.useState("Deleuzian Scholars");
  const [authors, setAuthors] = React.useState<string[]>([]);
  const [concepts, setConcepts] = React.useState<string[]>(["assemblage", "affect"]);
  const [ymin, setYmin] = React.useState<number | undefined>(1990);
  const [ymax, setYmax] = React.useState<number | undefined>(2025);
  const [maxItems, setMaxItems] = React.useState(20);
  const [includeLineage, setIncludeLineage] = React.useState(true);

  const [works, setWorks] = React.useState<any[]>([]);
  const [insights, setInsights] = React.useState<any[]>([]);
  const [lineage, setLineage] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load group members into authors on first mount (re-use catalog groups API if available)
  React.useEffect(() => {
    let alive = true;
    fetch(`${client["base"]}/catalog/groups/${encodeURIComponent(group)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (alive) setAuthors(d.scholars?.map((s:any)=>s.name) || []); })
      .catch(()=>{});
    return ()=>{ alive = false; };
  }, [group]);

  async function buildList() {
    setLoading(true); setError(null);
    try {
      const res = await client.readingListBuild({
        group, authors, concepts, ymin, ymax, maxItems, includeLineage
      });
      setWorks(res.works || []);
      setInsights(res.insights || []);
      setLineage(res.lineage || []);
    } catch (e:any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function exportMarkdown() {
    const lines:string[] = [];
    lines.push(`# Reading List\n`);
    lines.push(`**Concepts:** ${concepts.join(", ")}  `);
    lines.push(`**Authors:** ${authors.join(", ")}  `);
    lines.push("");
    if (insights?.length) {
      lines.push("## Comparative insights");
      for (const i of insights) {
        lines.push(`- **${i.title || "Insight"}** — ${i.summary}`);
        if (i.citations?.length) {
          const cits = i.citations.map((c:any)=>`${c.title}${c.year?` (${c.year})`:``}`).join("; ");
          lines.push(`  - _Citations:_ ${cits}`);
        }
      }
      lines.push("");
    }
    lines.push("## Works");
    works.forEach((w:any, idx:number) => {
      const cite = `- ${idx+1}. ${w.title}${w.year?` (${w.year})`:``} — ${w.authors?.join(", ")||""}${w.venue?`, *${w.venue}*`:``}`;
      const link = w.doi ? `https://doi.org/${w.doi}` : (w.url || "");
      const tags = w.concepts?.length ? `  \n   _Concepts:_ ${w.concepts.join(", ")}` : "";
      lines.push(cite + (link?`  \n   ${link}`:"") + tags);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reading-list.md"; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    // simplest: open the MD download (above) or rely on browser print-to-PDF
    window.print();
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Reading List Builder</h1>

      <div style={{ display:"grid", gap:8, gridTemplateColumns:"repeat(2,minmax(240px,1fr))" }}>
        <label>Group
          <input value={group} onChange={e=>setGroup(e.target.value)} />
        </label>

        <label>Authors (comma-separated)
          <input value={authors.join(", ")} onChange={e=>setAuthors(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}/>
        </label>

        <label>Concepts (comma-separated)
          <input value={concepts.join(", ")} onChange={e=>setConcepts(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}/>
        </label>

        <label>Year min
          <input type="number" value={ymin ?? ""} onChange={e=>setYmin(e.target.value ? Number(e.target.value) : undefined)}/>
        </label>

        <label>Year max
          <input type="number" value={ymax ?? ""} onChange={e=>setYmax(e.target.value ? Number(e.target.value) : undefined)}/>
        </label>

        <label>Max items
          <input type="number" value={maxItems} onChange={e=>setMaxItems(Number(e.target.value))}/>
        </label>

        <label style={{ alignSelf:"end" }}>
          <input type="checkbox" checked={includeLineage} onChange={e=>setIncludeLineage(e.target.checked)}/> Include lineage
        </label>
      </div>

      <div style={{ marginTop:12, display:"flex", gap:8 }}>
        <button onClick={buildList} disabled={loading}>Build Reading List</button>
        <button onClick={exportMarkdown} disabled={!works.length}>Export Markdown</button>
        <button onClick={exportPDF} disabled={!works.length}>Print / Save PDF</button>
      </div>

      {error && <div style={{ color:"crimson", marginTop:8 }}>Error: {error}</div>}
      {loading && <div style={{ marginTop:8 }}>Building…</div>}

      {!!insights.length && (
        <section style={{ marginTop:16 }}>
          <h2>Comparative insights</h2>
          <ul>
            {insights.map((i,idx)=>(
              <li key={idx}>
                <strong>{i.title || "Insight"}:</strong> {i.summary}
                {i.citations?.length ? (
                  <div style={{ fontSize:12, opacity:.9 }}>
                    Citations: {i.citations.map((c:any)=>c.title).join("; ")}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!works.length && (
        <section style={{ marginTop:16 }}>
          <h2>Works ({works.length})</h2>
          <ol>
            {works.map((w:any, idx:number)=>(
              <li key={idx} style={{ marginBottom:8 }}>
                <div>
                  <strong>{w.title}</strong>{w.year?` (${w.year})`:``}
                  {w.venue?` — ${w.venue}`:``}
                </div>
                <div style={{ fontSize:12 }}>
                  {w.authors?.join(", ")} {w.doi ? `— DOI: ${w.doi}` : (w.url ? `— URL: ${w.url}` : "")}
                </div>
                {w.concepts?.length ? (
                  <div style={{ fontSize:12, opacity:.9 }}>
                    Concepts: {w.concepts.join(", ")}
                  </div>
                ) : null}
                {(w.doi || w.url) && (
                  <div><a href={w.doi ? `https://doi.org/${w.doi}` : w.url} target="_blank" rel="noreferrer">Open</a></div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {!!lineage.length && (
        <section style={{ marginTop:16 }}>
          <h2>Lineage</h2>
          <ul>
            {lineage.map((e:any, i:number)=>(
              <li key={i}>{e.from} —[{e.relation}]→ {e.to}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
