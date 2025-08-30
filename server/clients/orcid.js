const ORCID_BASE = process.env.ORCID_BASE || 'https://pub.orcid.org/v3.0';

/** Normalize ORCID JSON -> BiblioItem[] (minimal) */
async function fetchOrcidWorks(orcid){
  const resp = await fetch(`${ORCID_BASE}/${orcid}/works`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "GCC-Biblio/1.0 (+contact: support@gcc.example)"
    }
  });
  if (!resp.ok) throw new Error('ORCID fetch failed');
  const json = await resp.json();

  // ORCID v3 returns { group: [ { "work-summary": [...] }, ... ] }
  const groups = Array.isArray(json.group) ? json.group : [];

  const out = [];

  for (const g of groups) {
    const summaries = g["work-summary"] || [];
    const s = summaries[0];
    if (!s) continue;
    const title = s.title?.title?.value || "Untitled";
    const year = Number(s["publication-date"]?.year?.value) || undefined;
    const putcode = s.putcode;
    const type = String(s.type || "other").toLowerCase().replace(/_/g, "-");

    // Extract external IDs
    const ids = s["external-ids"]?.["external-id"] || [];
    const doi = ids.find(x=>x["external-id-type"]==="doi")?.["external-id-value"];
    const isbn = ids.find(x=>x["external-id-type"]==="isbn")?.["external-id-value"];

    out.push({
      id: doi || isbn || `${orcid}-${putcode}`,
      source: "orcid",
      orcidPutcode: String(putcode),
      title,
      year,
      type,
      // journal-title is often the venue; publisher comes from Crossref later
      venue: s["journal-title"]?.value,
      doi: doi || undefined,
      isbn13: isbn || undefined,
      urls: doi ? [{label:"DOI", href:`https://doi.org/${doi}`}]: [],
      authors: [], // can be enriched later via work details
      concepts: [],
      scholarScore: undefined
    });
  }
  // If ORCID ever returns an empty 'group' but has 'last-modified-date', keep it graceful.
  return out;
}

module.exports = { fetchOrcidWorks };
