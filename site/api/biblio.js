export default async function handler(req, res) {
  const orcid = (req.query.orcid || '').trim();
  if (!orcid) {
    return res.status(400).json({ ok: false, error: 'Missing orcid' });
  }

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
    const detailPromises = summaries.map(s =>
      fetch(`${base}/work/${s['put-code']}`, { headers })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    );
    const details = (await Promise.all(detailPromises)).filter(Boolean);

    const TYPE_MAP = {
      'journal-article': 'article',
      'book': 'book',
      'book-chapter': 'chapter',
      'edited-book': 'edited-volume',
      'dissertation-thesis': 'thesis'
    };

    const items = details.map(w => {
      const ext = w?.['external-ids']?.['external-id'] || [];
      const doi = ext.find(e => e['external-id-type']?.toLowerCase() === 'doi')?.['external-id-value'];
      const isbn = ext.find(e => e['external-id-type']?.toLowerCase() === 'isbn')?.['external-id-value'];
      const uri = ext.find(e => e['external-id-type']?.toLowerCase() === 'uri')?.['external-id-value'];
      const authors = (w?.contributors?.contributor || []).map(c => {
        const name = c['credit-name']?.value || '';
        const parts = name.split(' ');
        return { family: parts.pop() || name, given: parts.join(' ') || undefined };
      });
      const urls = [];
      if (uri) urls.push({ label: 'Publisher', href: uri });
      if (doi) urls.push({ label: 'DOI', href: `https://doi.org/${doi}` });
      return {
        id: String(w['put-code']),
        source: 'orcid',
        orcidPutcode: String(w['put-code']),
        title: w?.title?.title?.value || '',
        subtitle: w?.title?.subtitle?.value || undefined,
        authors,
        year: w?.['publication-date']?.year?.value ? Number(w['publication-date'].year.value) : undefined,
        type: TYPE_MAP[w?.type] || 'other',
        publisher: w?.publisher || undefined,
        venue: w?.['journal-title']?.value || undefined,
        isbn13: isbn || undefined,
        doi: doi || undefined,
        urls,
        concepts: [],
        raw: w
      };
    });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ ok: true, orcid, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
