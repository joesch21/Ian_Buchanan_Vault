export type ToolDef = { name: string; description?: string; schema?: any; confirm?: boolean; };

export type QueryResponse =
  | { answer: string; citations?: { title: string; url: string }[] }
  | {
      needsTool: true;
      call: { name: string; args?: Record<string, any> };
      confirm?: boolean;
      draft?: string;
      answer?: string;
      citations?: { title: string; url: string }[];
    };

export class KnowClient {
  constructor(
    private base = import.meta.env.VITE_KNOW_API_BASE as string,
    private siteId = import.meta.env.VITE_DEFAULT_SITE_ID as string
  ) {
    if (!this.base) throw new Error("VITE_KNOW_API_BASE missing");
    if (!this.siteId) throw new Error("VITE_DEFAULT_SITE_ID missing");
  }

  async tools(siteId = this.siteId): Promise<ToolDef[]> {
    const r = await fetch(`${this.base}/tools?siteId=${encodeURIComponent(siteId)}`);
    if (!r.ok) throw new Error(`tools(): ${r.status}`);
    return r.json();
  }

  async query(msg: string, siteId = this.siteId): Promise<QueryResponse> {
    const r = await fetch(`${this.base}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, msg })
    });
    if (!r.ok) throw new Error(`query(): ${r.status}`);
    return r.json();
  }

  async groups(): Promise<{ groups: Record<string, { slug: string; description?: string; members: string[] }> }> {
    const r = await fetch(`${this.base}/catalog/groups`);
    if (!r.ok) throw new Error(`groups(): ${r.status}`);
    return r.json();
  }

  async groupDetail(name: string): Promise<{ group: string; meta?: any; scholars: any[] }> {
    const enc = encodeURIComponent(name);
    const r = await fetch(`${this.base}/catalog/groups/${enc}`);
    if (!r.ok) throw new Error(`groupDetail(${name}): ${r.status}`);
    return r.json();
  }
}
