import fetch from "node-fetch";
const ORCID_BASE = process.env.ORCID_BASE || "https://pub.orcid.org/v3.0";

export async function fetchOrcidWorks(orcid) {
  const url = `${ORCID_BASE}/${orcid}/works`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) throw new Error(`ORCID ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();

  const groups = json.group || [];
  return groups
    .map(g => {
      const s = g["work-summary"]?.[0];
      if (!s) return null;
      const title = s.title?.title?.value || "Untitled";
      const year = Number(s["publication-date"]?.year?.value) || undefined;
      const putcode = s.putcode;
      const type = (s.type || "other").toLowerCase().replace(/_/g, "-");
      const ids = s["external-ids"]?.["external-id"] || [];
      const doi = ids.find(x => x["external-id-type"] === "doi")?.["external-id-value"];
      const isbn = ids.find(x => x["external-id-type"] === "isbn")?.["external-id-value"];

      return {
        id: doi || isbn || `${orcid}-${putcode}`,
        source: "orcid",
        orcidPutcode: String(putcode),
        title,
        year,
        type,
        publisher: s["journal-title"]?.value,
        doi: doi || undefined,
        isbn13: isbn || undefined,
        urls: doi ? [{ label: "DOI", href: `https://doi.org/${doi}` }] : [],
        authors: [],
        concepts: [],
        scholarScore: undefined
      };
    })
    .filter(Boolean);
}
