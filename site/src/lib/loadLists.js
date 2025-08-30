export async function loadScholars() {
  const j = await fetch('/scholars/scholars.json').then(r => r.json());
  return j.groups || [];
}
export async function loadConcepts() {
  const j = await fetch('/concepts/concepts.json').then(r => r.json());
  return j.concepts || [];
}
