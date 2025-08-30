export async function fetchOrcidWorks(orcid) {
  const id = (orcid || '').trim();
  const res = await fetch(`/api/biblio?orcid=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`ORCID fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data?.ok) throw new Error(data.error || 'Invalid response');
  return data.items || [];
}
