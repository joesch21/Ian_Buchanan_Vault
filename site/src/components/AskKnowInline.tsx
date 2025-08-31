import { useState } from "react";
import { KnowClient } from "@/lib/knowClient";

type Props = {
  seed: string;        // initial question
  context?: string;    // short context injected to the prompt
  buttonLabel?: string;
};

export default function AskKnowInline({ seed, context, buttonLabel="Ask Know" }: Props) {
  const [q, setQ] = useState(seed);
  const [a, setA] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const client = new KnowClient(); // uses env

  async function ask() {
    const msg = context ? `${context}\n\nQ: ${q}` : q;
    setBusy(true); setA("");
    try {
      const res = await client.query(msg);
      if ("needsTool" in res && res.needsTool) {
        setA(res.draft || "This action requires a tool. Please try a simpler question.");
      } else {
        setA(res.answer);
      }
    } catch (e: any) {
      setA(e?.message || "Error contacting Know.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="askknow">
      <div className="askknow__row">
        <input
          className="askknow__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question about this section…"
        />
        <button className="askknow__btn" onClick={ask} disabled={busy}>
          {busy ? "Thinking…" : buttonLabel}
        </button>
      </div>
      {a && <div className="askknow__answer">{a}</div>}
    </div>
  );
}
