const BASE = import.meta.env.VITE_CARTO_API_BASE;

export async function health(): Promise<string> {
  const res = await fetch(`${BASE}/api/healthz`);
  if (!res.ok) throw new Error('health check failed');
  return res.text();
}

export async function compileCartography(payload: any): Promise<any> {
  const res = await fetch(`${BASE}/api/cartography/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('compile failed');
  return res.json();
}
