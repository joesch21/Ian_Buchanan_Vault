export type Work = {
  id: string;
  title: string;
  year?: number;
  authors: { orcid?: string; name: string }[];
  concepts?: string[];
  url?: string;
  doi?: string;
};

export async function fetchWorksByOrcids(orcids: string[]) {
  const base = import.meta.env.VITE_KNOW_API_BASE as string | undefined;
  const urls = [
    base && `${base.replace(/\/$/, "")}/biblio/works?orcids=${encodeURIComponent(orcids.join(","))}`,
    `/api/orcid/works?orcids=${encodeURIComponent(orcids.join(","))}`,
    `/data/biblio-cache.json`
  ].filter(Boolean) as string[];

  let last: any;
  for (const u of urls) {
    try {
      const r = await fetch(u);
      if (r.ok) return r.json();
      last = await r.text();
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`Failed to fetch works (404)`);
}
