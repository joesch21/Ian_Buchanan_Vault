import { useState } from "react";

const SEED = [
  "How does assemblage theory differ from structuralism?",
  "What pedagogical move does Chapter 1 of ATM make?",
  "How do you contrast your reading of affect with Massumi’s?"
];

export default function Trainer() {
  const [q, setQ] = useState(SEED[0]);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState("");
  const [tags, setTags] = useState("assemblage, pedagogy");

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/forms/submit-qa", {
      method: "POST",
      body: fd,
      headers: { "X-Requested-With": "trainer-form" }
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error || "Submit failed");
    alert(`Submitted! PR: ${j.prUrl}`);
    e.currentTarget.reset();
  }

  return (
    <main style={{maxWidth:680, margin:"40px auto", padding:"0 16px"}}>
      <h1>Ian Trainer</h1>
      <p>Answer any prompt below. You can type, paste a transcript, or attach a short PDF.</p>

      <form onSubmit={onSubmit} encType="multipart/form-data">
        <label>Question</label>
        <select name="question" value={q} onChange={e=>setQ(e.target.value)}>
          {SEED.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label style={{marginTop:12}}>Answer (text, optional if transcript or file provided)</label>
        <textarea name="answer" rows={6} value={answer} onChange={e=>setAnswer(e.target.value)} />

        <label style={{marginTop:12}}>Transcript (optional)</label>
        <textarea name="transcript" rows={4} value={transcript} onChange={e=>setTranscript(e.target.value)} />

        <label style={{marginTop:12}}>Attach PDF / .txt / .md (optional)</label>
        <input type="file" name="file" accept=".pdf,.txt,.md" />

        <label style={{marginTop:12}}>Tags (comma-separated)</label>
        <input name="tags" value={tags} onChange={e=>setTags(e.target.value)} />

        {/* Optional: hCaptcha widget */}
        {/* <div className="h-captcha" data-sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}></div> */}

        <button type="submit" style={{marginTop:16}}>Submit to Vault</button>
      </form>

      <details style={{marginTop:20}}>
        <summary>How it works</summary>
        <ol>
          <li>Your submission becomes a Pull Request in the Vault data repo.</li>
          <li>On merge, the Q&A feed updates and the AI can cite it.</li>
        </ol>
      </details>
    </main>
  );
}
