export async function resolveName(orcid: string): Promise<string> {
  try {
    const u = `https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/person`;
    const r = await fetch(u, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const given = j?.name?.['given-names']?.value;
    const family = j?.name?.['family-name']?.value;
    const name = [given, family].filter(Boolean).join(' ').trim();
    return name || orcid;
  } catch {
    return orcid;
  }
}
