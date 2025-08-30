export default async function handler(req, res) {
  const orcid = (req.query.orcid || '0000-0003-4864-6495').trim();
  const base = `https://pub.orcid.org/v3.0/${orcid}`;
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'IanBuchananVault/1.0 (mailto:joesch22.js@gmail.com)'
  };

  try {
    const worksResp = await fetch(`${base}/works`, { headers });
    if (!worksResp.ok) throw new Error(`ORCID /works failed: ${worksResp.status}`);
    const works = await worksResp.json();

    const summaries = (works?.group || []).flatMap(g => g['work-summary'] || []);
    if (!summaries.length) {
      return res.status(200).json({
        ok: true, source: 'orcid-api', orcid, count: 0, fetchedAt: new Date().toISOString(), rows: []
      });
    }

    const detailPromises = summaries.map(s => {
      const put = s?.['put-code'];
      if (put === undefined || put === null) return null;
      return fetch(`${base}/work/${put}`, { headers })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null);
    }).filter(Boolean);

    const details = (await Promise.all(detailPromises)).filter(Boolean);

    const rows = details.map(w => ({
      orcid_id: orcid,
      title: w?.title?.title?.value || '',
      type: w?.type || '',
      year: w?.['publication-date']?.year?.value || '',
      journal_or_publisher: w?.['journal-title']?.value || w?.publisher || '',
      doi: (w?.['external-ids']?.['external-id'] || [])
        .find(e => e?.['external-id-type']?.toLowerCase() === 'doi')?.['external-id-value'] || '',
      url: (w?.['external-ids']?.['external-id'] || [])
        .find(e => e?.['external-id-type']?.toLowerCase() === 'uri')?.['external-id-value'] || ''
    }));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({
      ok: true, source: 'orcid-api', orcid, count: rows.length, fetchedAt: new Date().toISOString(), rows
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
