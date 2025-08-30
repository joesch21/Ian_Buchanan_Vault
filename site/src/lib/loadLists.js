export async function loadScholars() {
  const list = await fetch('/api/scholars').then(r => r.json()).catch(() => []);
  const members = (Array.isArray(list) ? list : []).map((s, i) => ({
    id: (s.name || `scholar-${i}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: s.name,
    orcid: (s.orcid || '').trim()
  }));
  return [{ id: 'all', label: 'Scholars', members }];
}

export async function loadConcepts() {
  const j = await fetch('/concepts/concepts.json').then(r => r.json());
  return j.concepts || [];
}
