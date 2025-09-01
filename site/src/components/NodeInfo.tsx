import React from "react";
import { KnowClient } from "@/lib/knowClient";

type Node = {
  id: string;
  type: "author" | "work" | "concept";
  label: string;
  code?: string;
  year?: number;
  url?: string;
  orcid?: string;
};
type Ref = { title: string; url?: string; doi?: string; year?: number };

const sessionCache = new Map<string, string>();

export default function NodeInfo({
  node: nodeProp,
  refsByCode,
  onClose,
}: {
  node: Node;
  refsByCode: Record<string, Ref[]>;
  onClose: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [answer, setAnswer] = React.useState<string>("");
  const [citations, setCitations] = React.useState<{
    title: string;
    url?: string;
  }[]>([]);
  const [pinned, setPinned] = React.useState(false);
  const [currentNode, setCurrentNode] = React.useState(nodeProp);
  const client = new KnowClient();

  React.useEffect(() => {
    if (!pinned) setCurrentNode(nodeProp);
  }, [nodeProp, pinned]);

  const cacheKey = `${currentNode.type}:${currentNode.id}`;

  React.useEffect(() => {
    setCitations([]);
    if (sessionCache.has(cacheKey)) {
      setAnswer(sessionCache.get(cacheKey)!);
    } else {
      setAnswer("");
    }
  }, [cacheKey]);

  // build a tiny context from our graph
  function buildContext() {
    const lines: string[] = [];
    if (currentNode.type === "concept") {
      const code = currentNode.code || "";
      const refs = refsByCode[code] || [];
      if (refs.length) {
        lines.push("Relevant works:");
        for (const r of refs.slice(0, 6))
          lines.push(
            `- ${r.title}${r.year ? ` (${r.year})` : ""}${r.doi ? ` doi:${r.doi}` : ""}`
          );
      }
    }
    if (currentNode.type === "work" && currentNode.year)
      lines.push(`Work year: ${currentNode.year}`);
    if (currentNode.type === "author" && currentNode.orcid)
      lines.push(`Author ORCID: ${currentNode.orcid}`);
    return lines.join("\n");
  }

  async function ask() {
    if (sessionCache.has(cacheKey)) {
      setAnswer(sessionCache.get(cacheKey)!);
      return;
    }
    setBusy(true);
    try {
      const prompt = [
        `Explain "${currentNode.label}" (${currentNode.type}).`,
        `Relate it to Deleuzian usage and Buchanan’s scholarship when applicable.`,
        `Be concise (120–180 words) and define jargon.`,
        `Use the provided "Relevant works" when present and prefer those for citations.`,
        buildContext(),
      ].join("\n");
      const res = await client.query(prompt);
      const ans =
        "needsTool" in res ? res.draft || "" : (res as any).answer || "";
      setAnswer(ans);
      sessionCache.set(cacheKey, ans);
      setCitations((res.citations || []).slice(0, 6));
    } catch (e: any) {
      setAnswer(`(Error) ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  const localRefs =
    currentNode.type === "concept"
      ? refsByCode[currentNode.code || ""] || []
      : [];

  return (
    <div className="nodeinfo">
      <div className="ni-head">
        <b>{currentNode.label}</b>{" "}
        <small style={{ opacity: 0.8 }}>({currentNode.type})</small>
        <div>
          <button className="ni-pin" onClick={() => setPinned(!pinned)}>
            {pinned ? "📌" : "📍"}
          </button>
          <button
            className="ni-x"
            onClick={() => {
              setPinned(false);
              onClose();
            }}
          >
            ×
          </button>
        </div>
      </div>

      {currentNode.url && (
        <p>
          <a href={currentNode.url} target="_blank" rel="noreferrer">
            Open source
          </a>
        </p>
      )}

      <button className="ni-ask" disabled={busy} onClick={ask}>
        {busy ? "Asking…" : "Ask AI about this"}
      </button>

      {answer && (
        <>
          <div className="ni-answer">{answer}</div>
          <button
            className="ni-trainer"
            onClick={() => {
              const draft = {
                q: `Explain ${currentNode.label}`,
                a: answer,
                tags: [currentNode.type, currentNode.label],
              };
              sessionStorage.setItem(
                "trainer-draft",
                JSON.stringify(draft)
              );
              window.location.href = "/trainer";
            }}
          >
            Save to Trainer
          </button>
        </>
      )}

      {(localRefs.length > 0 || citations.length > 0) && (
        <div className="ni-refs">
          <div className="ni-sub">Citations</div>
          <ul>
            {localRefs.map((r, i) => (
              <li key={`lr-${i}`}>
                <a
                  href={r.url || (r.doi ? `https://doi.org/${r.doi}` : "#")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.title}
                  {r.year ? ` (${r.year})` : ""}
                </a>
              </li>
            ))}
            {citations.map((c, i) => (
              <li key={`kc-${i}`}>
                <a href={c.url || "#"} target="_blank" rel="noreferrer">
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

