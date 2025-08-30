const BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:8787/api/orcid';

export async function fetchOrcidWorks(id) {
  const res = await fetch(`${BASE}/${id}/works`);
  if (!res.ok) throw new Error('Failed to fetch ORCID');
  const data = await res.json();
  return data.works || data;
}
