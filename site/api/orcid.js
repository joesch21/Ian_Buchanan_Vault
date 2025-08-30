export default async function handler(req, res) {
  const orcid = (req.query.orcid || '0000-0003-4864-6495').trim();
  const base = `https://pub.orcid.org/v3.0/${orcid}`;
  const headers = { Accept: 'application/json' };

  try {
    const works = await fetch(`${base}/works`, { headers }).then(r => r.json());
    const summaries = (works.group || []).flatMap(g => g['work-summary'] || []);
    const details = await Promise.all(
      summaries.map(s => fetch(`${base}/work/${s['put-code']}`, { headers }).then(r => r.json()))
    );
    const rows = details.map(w => ({
      title: w?.title?.title?.value || '',
      type: w?.type || '',
      year: w?.['publication-date']?.year?.value || '',
      journal_or_publisher: w?.['journal-title']?.value || w?.publisher || '',
      doi: (w?.['external-ids']?.['external-id'] || [])
             .find(e => e['external-id-type'] === 'doi')?.['external-id-value'] || '',
      url: (w?.['external-ids']?.['external-id'] || [])
             .find(e => e['external-id-type'] === 'uri')?.['external-id-value'] || '',
      source: 'ORCID',
      orcid_id: orcid
    }));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
