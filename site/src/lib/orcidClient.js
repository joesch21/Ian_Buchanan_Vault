const BASE = '/api/orcid';

export async function fetchOrcidWorks(id) {
  const res = await fetch(`${BASE}/${id}/works`);
  if (!res.ok) throw new Error('Failed to fetch ORCID');
  const data = await res.json();
  return data.works || [];
}
