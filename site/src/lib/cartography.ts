import { fetchWorksByOrcids } from "@/lib/biblio";
import { resolveName } from "@/lib/names";
import { enrichWithCrossref } from "@/lib/crossref";

export type GraphJSON = {
  nodes: { id:string; type:"author"|"work"|"concept"; label:string; year?:number; url?:string; code?:string; orcid?:string }[];
  edges: { source:string; target:string; kind:"authored"|"concept"|"coauthor"|"influences" }[];
  refs:  Record<string, { title:string; url?:string; doi?:string; year?:number }[]>; // code -> works
};

function codeFor(label:string, year?:number) {
  const words = label.split(/\s+/).filter(Boolean);
  const initials = words.slice(0,2).map(w=>w[0].toUpperCase()).join("");
  const yy = year ? String(year).slice(-2) : "";
  return yy ? `${initials}-${yy}` : `${initials}`;
}

export async function compileCartography(spec:any): Promise<GraphJSON> {
  const scholarOrcids = (spec.scholars || []).filter((s:string)=>/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(s));
  const works = (scholarOrcids.length ? await fetchWorksByOrcids(scholarOrcids) : [])
    .filter((w:any)=> {
      if (!spec.years?.min && !spec.years?.max) return true;
      const y = Number(w.year||0);
      return (!spec.years?.min || y >= spec.years.min) && (!spec.years?.max || y <= spec.years.max);
    });

  const enriched = await Promise.all(works.map(enrichWithCrossref));

  const nodes: GraphJSON["nodes"] = [];
  const edges: GraphJSON["edges"] = [];
  const refs: GraphJSON["refs"] = {};

  const authorNames = new Map<string,string>();
  for (const w of enriched) for (const a of (w.authors||[])) if (a.orcid) {
    if (!authorNames.has(a.orcid)) authorNames.set(a.orcid, await resolveName(a.orcid));
  }

  const conceptSet = new Set<string>((spec.concepts || []).map((c:string)=>c.toLowerCase()));
  for (const c of conceptSet) {
    const code = `#${c.slice(0,3).toUpperCase()}`;
    nodes.push({ id:`concept:${c}`, type:"concept", label:c, code });
    refs[code] = [];
  }

  for (const w of enriched) {
    const wid = w.id;
    const wcode = codeFor(w.title, w.year);
    nodes.push({ id: wid, type:"work", label: w.title, year:w.year, url:w.url, code:wcode });

    for (const a of (w.authors||[])) {
      const aid = a.orcid || `${wid}:anon`;
      if (!nodes.find(n=>n.id===aid)) {
        const label = authorNames.get(a.orcid) || a.name || aid;
        nodes.push({ id: aid, type:"author", label, orcid:a.orcid, code: codeFor(label) });
      }
      edges.push({ source: aid, target: wid, kind:"authored" });
    }

    for (const c of conceptSet) {
      if (w.title?.toLowerCase().includes(c)) {
        edges.push({ source:`concept:${c}`, target: wid, kind:"concept" });
        refs[`#${c.slice(0,3).toUpperCase()}`].push({ title:w.title, url:w.url, doi:w.doi, year:w.year });
      }
    }
  }

  if (spec.mode === "co_work") {
    const byWork = new Map<string,string[]>();
    for (const e of edges.filter(e=>e.kind==="authored")) {
      const arr = byWork.get(e.target) || [];
      arr.push(e.source);
      byWork.set(e.target, arr);
    }
    for (const arr of byWork.values()) {
      for (let i=0;i<arr.length;i++) for (let j=i+1;j<arr.length;j++) {
        edges.push({ source: arr[i], target: arr[j], kind:"coauthor" });
      }
    }
  }

  if (spec.mode === "lineage") {
    const workNodes = nodes.filter(n=>n.type==="work");
    for (const a of workNodes) for (const b of workNodes) {
      if (a.id===b.id) continue;
      if ((a.year||0) < (b.year||0)) {
        const hasShared = edges.some(e=>e.kind==="concept" && e.target===a.id) &&
                          edges.some(e=>e.kind==="concept" && e.target===b.id);
        if (hasShared) edges.push({ source:a.id, target:b.id, kind:"influences" });
      }
    }
  }

  return { nodes, edges, refs };
}
