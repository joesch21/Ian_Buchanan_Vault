const base = process.env.ORCID_BASE || 'https://pub.orcid.org/v3.0';

async function fetchWorks(id) {
  const res = await fetch(`${base}/${id}/works`, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`ORCID ${res.status}`);
  const data = await res.json();
  const groups = data.group || [];
  return groups.map(g => {
    const w = g['work-summary'][0];
    const ext = w['external-ids']?.['external-id'] || [];
    const doi = ext.find(e => e['external-id-type'] === 'doi');
    return {
      id: w['put-code'],
      title: w.title?.title?.value,
      year: w['publication-date']?.year?.value,
      type: w.type,
      doi: doi ? doi['external-id-value'] : undefined
    };
  });
}

module.exports = { fetchWorks };
