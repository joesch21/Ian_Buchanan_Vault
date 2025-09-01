import { useEffect, useMemo, useRef, useState } from "react";
import { fetchTrainerQuestions, generateNewQuestions } from "@/lib/trainerAdmin";

const FALLBACK = [
  "How does assemblage theory differ from structuralism?",
  "What pedagogical move does Chapter 1 of ATM make?",
  "Contrast Buchanan’s reading of affect with Massumi’s."
];

function AdminBar({ onGenerated }) {
  const [busy, setBusy] = useState(false);
  const isAdmin = useMemo(() => import.meta.env.VITE_TRAINER_ADMIN === "1", []);
  if (!isAdmin) return null;

  async function clickGenerate() {
    const pin = window.prompt("Enter PIN to generate fresh questions:");
    if (!pin) return;
    try {
      setBusy(true);
      const out = await generateNewQuestions(pin);
      alert(
        `Generated ${out.count} questions for ${out.week}${
          out.prUrl ? `\nPR: ${out.prUrl}` : ""
        }`
      );
      onGenerated?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function clickPreview() {
    const pin = window.prompt("Enter PIN for dry run (preview only):");
    if (!pin) return;
    try {
      setBusy(true);
      const out = await generateNewQuestions(pin, undefined, true);
      alert(
        `Preview for ${out.week} — ${out.count} items\n\nNew vs last set:\n${
          (out.newItems || []).join("\n") || "(no diff)"
        }`
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ margin: "16px 0", padding: "8px 0", borderTop: "1px solid #eee" }}>
      <button disabled={busy} onClick={clickGenerate}>
        {busy ? "Generating…" : "Generate new questions"}
      </button>
      <button disabled={busy} onClick={clickPreview} style={{ marginLeft: 8 }}>
        Dry run (preview)
      </button>
      <small style={{ marginLeft: 8, opacity: 0.7 }}>PIN required</small>
    </div>
  );
}

export default function Trainer() {
  const [questions, setQuestions] = useState(FALLBACK);
  const [week, setWeek] = useState("");
  const [tags, setTags] = useState("assemblage, pedagogy");
  const [selected, setSelected] = useState(FALLBACK[0]);
  const [answer, setAnswer] = useState("");
  const draftRef = useRef(null);

  // Fetch dynamic questions on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTrainerQuestions();
        if (!cancelled && data?.items?.length) {
          const qs = data.items.map((x) => x.question);
          if (draftRef.current?.q && !qs.includes(draftRef.current.q)) {
            qs.unshift(draftRef.current.q);
          }
          setQuestions(qs);
          setSelected(draftRef.current?.q || qs[0] || FALLBACK[0]);
          setWeek(data.week || "");
        }
      } catch {
        // keep FALLBACK
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const d = sessionStorage.getItem("trainer-draft");
    if (d) {
      try {
        const { q, a, tags: t } = JSON.parse(d);
        draftRef.current = { q };
        if (q) {
          setQuestions((prev) => (prev.includes(q) ? prev : [q, ...prev]));
          setSelected(q);
        }
        if (a) setAnswer(a);
        if (t) setTags(Array.isArray(t) ? t.join(", ") : t);
      } catch {
        /* noop */
      }
      sessionStorage.removeItem("trainer-draft");
    }
  }, []);

  // Existing submit handler (unchanged)
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/forms/submit-qa", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) return alert(j.error || "Submit failed");
    alert(`Submitted! PR: ${j.prUrl}`);
    e.currentTarget.reset();
  }

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 16px" }}>
      <h1>Ian Trainer {week ? <small style={{ fontSize: 14, opacity: 0.7 }}>({week})</small> : null}</h1>
      <p>Answer any prompt below. You can type, paste a transcript, or attach a short PDF.</p>

      <form onSubmit={onSubmit} encType="multipart/form-data">
        <label>Question</label>
        <select
          name="question"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {questions.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>

        <label style={{ marginTop: 12 }}>
          Answer (text, optional if transcript or file provided)
        </label>
        <textarea
          name="answer"
          rows={6}
          placeholder="Write your answer here…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <label style={{ marginTop: 12 }}>Transcript (optional)</label>
        <textarea name="transcript" rows={4} placeholder="Paste a voice transcript…" />

        <label style={{ marginTop: 12 }}>Attach PDF / .txt / .md (optional)</label>
        <input type="file" name="file" accept=".pdf,.txt,.md" />

        <label style={{ marginTop: 12 }}>Tags (comma-separated)</label>
        <input
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="assemblage, pedagogy"
        />

        <button type="submit" style={{ marginTop: 16 }}>
          Submit to Vault
        </button>
      </form>

      <AdminBar onGenerated={() => window.location.reload()} />

      <details style={{ marginTop: 20 }}>
        <summary>How it works</summary>
        <ol>
          <li>Prompts are generated from the bibliography and stored weekly.</li>
          <li>Your submission becomes a PR in the Vault data repo.</li>
          <li>On merge, the feed updates and the AI can cite it.</li>
        </ol>
      </details>
    </main>
  );
}
