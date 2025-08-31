export async function fetchTrainerQuestions(siteId = import.meta.env.VITE_DEFAULT_SITE_ID || "buchanan-vault") {
  const base = import.meta.env.VITE_KNOW_API_BASE as string;
  const r = await fetch(`${base}/questions?siteId=${encodeURIComponent(siteId)}`, { credentials: "omit" });
  if (!r.ok) throw new Error(`GET /questions ${r.status}`);
  return r.json() as Promise<{ week: string; items: { id: string; question: string; tags?: string[] }[] }>;
}

export async function generateNewQuestions(pin: string, siteId = import.meta.env.VITE_DEFAULT_SITE_ID || "buchanan-vault", dryRun = false) {
  const base = import.meta.env.VITE_KNOW_API_BASE as string;
  const r = await fetch(`${base}/_admin/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin, siteId, dryRun })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `POST /_admin/generate-questions ${r.status}`);
  return j as { ok: true; week: string; count: number; prUrl?: string; newItems?: string[] };
}
