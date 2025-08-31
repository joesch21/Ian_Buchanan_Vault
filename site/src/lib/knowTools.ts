export type ToolCall = { name: string; args?: Record<string, any> };

export async function runTool(call: ToolCall): Promise<{ ok: boolean; message?: string }> {
  const { name, args = {} } = call;

  if (name === "openBibliography") {
    const params = new URLSearchParams();
    if (args.query) params.set("q", String(args.query));
    if (args.type) params.set("type", String(args.type));
    if (args.yearMin) params.set("ymin", String(args.yearMin));
    if (args.yearMax) params.set("ymax", String(args.yearMax));
    const href = `/bibliography${params.toString() ? `?${params.toString()}` : ""}`;
    window.location.assign(href);
    return { ok: true, message: "Opening Bibliography…" };
  }

  if (name === "copyWikiBlock") {
    const text = String(args.selection || "");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for iOS/webviews
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    return { ok: true, message: "Copied to clipboard." };
  }

  return { ok: false, message: `Unknown tool: ${name}` };
}
