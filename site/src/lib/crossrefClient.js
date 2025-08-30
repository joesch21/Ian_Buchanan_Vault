export async function fetchCrossrefWork(doi) {
  const id = (doi || '').trim();
  if (!id) return null;
  const res = await fetch(`/api/crossref?doi=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Crossref fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data?.ok) throw new Error(data.error || 'Invalid response');
  return data.result || null;
}
