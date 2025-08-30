export async function loadScholars() {
  const j = await fetch('/scholars/scholars.json').then(r => r.json());
  // ensure structure: groups[].members[] with {id,name,orcid}
  return (j.groups || []).map(g => ({
    id: g.id,
    label: g.label,
    members: (g.members || []).map(m => ({
      id: m.id,
      name: m.name,
      orcid: (m.orcid || '').trim()
    }))
  }));
}

export async function loadConcepts() {
  const j = await fetch('/concepts/concepts.json').then(r => r.json());
  return j.concepts || [];
}
