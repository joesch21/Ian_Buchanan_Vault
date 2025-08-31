// Runtime: nodejs (NOT edge, we need node fetch & URL libs)
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

// Minimal ORCID work shape → our frontend Work[]
type Work = {
  id: string;
  title: string;
  year?: number;
  authors: { orcid?: string; name: string }[];
  concepts?: string[];
};

async function fetchOrcidWorks(orcid: string): Promise<Work[]> {
  // ORCID public API: summary record -> activities -> works
  // https://pub.orcid.org/v3.0/{orcid}/works (JSON)
  const url = `https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/works`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`ORCID ${orcid} ${r.status}`);
  const data = await r.json();

  // Flatten basic summary items. We only extract title & year quickly.
  const group = data.group ?? [];
  const works: Work[] = [];
  for (const g of group) {
    const summaries = g["work-summary"] ?? [];
    for (const s of summaries) {
      const title = s?.title?.title?.value || "Untitled";
      const yearStr = s?.["publication-date"]?.year?.value;
      const year = yearStr ? Number(yearStr) : undefined;
      const putCode = s?.["put-code"];
      works.push({
        id: `${orcid}:${putCode ?? title}`,
        title,
        year,
        authors: [{ orcid, name: orcid }], // ORCID API needs extra calls for full names; keep orcid as placeholder
        concepts: [] // concepts/tags not provided by ORCID; leave empty
      });
    }
  }
  return works;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const orcidsParam = String(req.query.orcids || "").trim();
    if (!orcidsParam) return res.status(400).json({ error: "missing orcids" });
    const orcids = orcidsParam.split(",").map(s => s.trim()).filter(Boolean);

    // Fetch in parallel, flatten, and de-dupe by id
    const batches = await Promise.allSettled(orcids.map(fetchOrcidWorks));
    const outMap = new Map<string, Work>();
    for (const b of batches) {
      if (b.status === "fulfilled") {
        for (const w of b.value) outMap.set(w.id, w);
      }
    }
    const all = [...outMap.values()];
    if (!all.length) return res.status(404).json({ error: "no works found" });

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(all);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "server error" });
  }
}
