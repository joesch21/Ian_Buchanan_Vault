export async function enrichWithCrossref(work: any) {
  try {
    if (work.doi && work.url) return work;
    const q = encodeURIComponent(work.title || "");
    const r = await fetch(`https://api.crossref.org/works?rows=1&query.title=${q}`);
    if (!r.ok) return work;
    const data = await r.json();
    const item = data?.message?.items?.[0];
    if (!item) return work;
    if (!work.doi && item.DOI) {
      work.doi = item.DOI;
      work.url = `https://doi.org/${item.DOI}`;
    }
    if (!work.url && item.URL) work.url = item.URL;
    if (!work.year && item.issued?.['date-parts']?.[0]?.[0]) {
      work.year = item.issued['date-parts'][0][0];
    }
    return work;
  } catch {
    return work;
  }
}
