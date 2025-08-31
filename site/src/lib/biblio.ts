export type Work = {
  id: string; title: string; year?: number;
  authors: { orcid?: string; name: string }[];
  concepts?: string[];
};

export async function fetchWorksByOrcids(orcids: string[]): Promise<Work[]> {
  const base = import.meta.env.VITE_KNOW_API_BASE as string;
  const url = `${base}/biblio/works?orcids=${encodeURIComponent(orcids.join(","))}`;
  const r = await fetch(url);
  if (r.ok) return r.json();
  throw new Error(`Failed to fetch works (${r.status})`);
}
