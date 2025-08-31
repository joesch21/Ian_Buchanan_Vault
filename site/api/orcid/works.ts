export const config = { runtime: "nodejs" };
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Frontend Work type
export type Work = {
  id: string;
  title: string;
  year?: number;
  authors: { orcid?: string; name: string }[];
  concepts?: string[];
  url?: string;
  doi?: string;
};

async function fetchOrcidSummaries(orcid: string) {
  const u = `https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/works`;
  const r = await fetch(u, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`ORCID ${orcid} ${r.status}`);
  return r.json();
}

async function fetchOrcidWorkDetail(orcid: string, putCode: number | string) {
  const u = `https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/work/${putCode}`;
  const r = await fetch(u, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`work ${putCode} ${r.status}`);
  return r.json();
}

async function fetchOrcidWorks(orcid: string): Promise<Work[]> {
  const sum = await fetchOrcidSummaries(orcid);
  const group = sum.group ?? [];

  const summaries: { putCode?: number | string; title: string; year?: number }[] = [];
  for (const g of group) {
    for (const s of g["work-summary"] ?? []) {
      summaries.push({
        putCode: s?.["put-code"],
        title: s?.title?.title?.value || "Untitled",
        year: s?.["publication-date"]?.year?.value
          ? Number(s["publication-date"].year.value)
          : undefined,
      });
    }
  }

  const chosen = summaries.slice(0, 40);
  const details = await Promise.allSettled(
    chosen.map((x) => fetchOrcidWorkDetail(orcid, x.putCode as any))
  );

  const linkMap = new Map<number | string, { doi?: string; url?: string }>();
  details.forEach((d, i) => {
    if (d.status !== "fulfilled") return;
    const exids = d.value?.["external-ids"]?.["external-id"] ?? [];
    let doi: string | undefined,
      url: string | undefined;
    for (const ex of exids) {
      const type = String(ex?.["external-id-type"] || "").toLowerCase();
      const val = ex?.["external-id-value"];
      if (type === "doi" && val) doi = val;
      if (!doi && type === "uri" && val) url = val;
    }
    linkMap.set(chosen[i].putCode!, { doi, url });
  });

  return chosen.map((x) => {
    const lk = linkMap.get(x.putCode!);
    const doiUrl = lk?.doi ? `https://doi.org/${lk.doi}` : undefined;
    return {
      id: `${orcid}:${x.putCode ?? x.title}`,
      title: x.title,
      year: x.year,
      authors: [{ orcid, name: orcid }],
      concepts: [],
      doi: lk?.doi,
      url: doiUrl || lk?.url,
    };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const orcidsParam = String(req.query.orcids || "").trim();
    if (!orcidsParam) return res.status(400).json({ error: "missing orcids" });
    const orcids = orcidsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const batches = await Promise.allSettled(orcids.map(fetchOrcidWorks));
    const out = new Map<string, Work>();
    for (const b of batches)
      if (b.status === "fulfilled")
        for (const w of b.value) out.set(w.id, w);
    const arr = [...out.values()];
    if (!arr.length) return res.status(404).json({ error: "no works found" });

    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).json(arr);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server error" });
  }
}
