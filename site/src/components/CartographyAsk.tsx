import { useState } from "react";
import { KnowClient } from "@/lib/knowClient";

const SYSTEM_HINT = `\nYou help build a scholarly cartography JSON spec for Buchanan Vault.\nReturn a JSON object only. Fields:\n{\n  "mode": "concept_comparison" | "lineage" | "co_work",\n  "concepts": string[],             // e.g. ["assemblage","affect"]\n  "scholars": string[],             // ORCIDs or names\n  "years": { "min"?: number, "max"?: number },\n  "minConceptFreq"?: number,        // for denoising\n  "notes"?: string\n}\nIf user gives nothing, propose a focused default using Buchanan + assemblage.\n`;

export default function CartographyAsk({ onSpec }:{ onSpec:(spec:any)=>void }) {
  const [q, setQ] = useState("Compare ‘assemblage’ vs ‘affect’ in Buchanan & Massumi, 2000–2015.");
  const [busy, setBusy] = useState(false);
  const client = new KnowClient();

  async function ask() {
    setBusy(true);
    try {
      const res = await client.query(`${SYSTEM_HINT}\nUser: ${q}`);
      if ("needsTool" in res) throw new Error("Tool call not supported here.");
      const jsonMatch = (res.answer || "").match(/\{[\s\S]*\}$/);
      const spec = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        mode:"concept_comparison", concepts:["assemblage","affect"], scholars:["Ian Buchanan"], years:{min:2000,max:2015}
      };
      onSpec(spec);
    } catch (e:any) {
      alert("Ask failed: " + (e?.message||e));
    } finally { setBusy(false); }
  }

  return (
    <div className="askrow">
      <div className="preset-row">
        <button onClick={()=>setQ("Compare ‘assemblage’ vs ‘affect’ in Buchanan & Massumi, 2000–2015.")}>Concept comparison</button>
        <button onClick={()=>setQ("Map lineage/influence around ‘schizoanalysis’ across Deleuzian scholars 1995–2010.")}>Lineage / influence</button>
        <button onClick={()=>setQ("Show co-work clusters for Deleuze & Guattari studies after 2010.")}>Co-work clusters</button>
      </div>
      <div className="askinput">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Describe the cartography you want…" />
        <button onClick={ask} disabled={busy}>{busy ? "Thinking…" : "Compile"}</button>
      </div>
    </div>
  );
}
