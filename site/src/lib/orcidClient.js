const API = import.meta.env.VITE_API_BASE || '/api';
const BASE = `${API}/orcid`;

export async function fetchOrcidWorks(id) {
  const res = await fetch(`${BASE}/${id}/works`);
  if (!res.ok) throw new Error('Failed to fetch ORCID');
  return await res.json();
}
