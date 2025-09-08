import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function KnowWidget() {
  const disabled = typeof window !== "undefined" && localStorage.getItem("know_disabled") === "1";
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log("Know open");
      setPrompt("");
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      console.log("Know close");
    }
  }, [isOpen]);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      setPrompt(typeof e.target?.value === "string" ? e.target.value : "");
    } catch (err) {
      console.error("Know input error", err);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); void onSubmit(); }
  };

  const onSubmit = async () => {
    const q = prompt.trim();
    if (!q) return;
    try {
      console.log("Know submit", q);
      setBusy(true);
      // TODO: call /api/know/v1/answer(q, context)
    } catch (err) {
      console.error("Know submit failed", err);
    } finally {
      setBusy(false);
    }
  };

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  if (disabled) {
    return <div className="know-disabled">Know is temporarily unavailable—try again soon.</div>;
  }

  return (
    <>
      <button className="know-fab" onClick={open} aria-label="Open Know">?</button>
      {isOpen && createPortal(
        <div className="know-portal" role="dialog" aria-modal="true" onClick={(e)=>{ if (e.target === e.currentTarget) close(); }}>
          <div className="know-sheet" onClick={(e)=>e.stopPropagation()}>
            <header className="know-header">
              <strong>Know</strong>
              <button className="icon-btn" onClick={close} aria-label="Close">×</button>
            </header>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="Ask with citations…"
              rows={3}
              inputMode="text"
              autoCapitalize="sentences"
              autoCorrect="on"
            />
            <div className="row">
              <button className="primary" onClick={onSubmit} disabled={busy}>
                {busy ? "Thinking…" : "Ask"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

