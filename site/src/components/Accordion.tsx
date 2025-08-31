import { useState, ReactNode } from "react";

type Item = { id: string; title: string; content: ReactNode; defaultOpen?: boolean };

export default function Accordion({ items }: { items: Item[] }) {
  return (
    <div className="acc">
      {items.map(it => <AccordionItem key={it.id} {...it} />)}
    </div>
  );
}

function AccordionItem({ id, title, content, defaultOpen }: Item) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section className={`acc__item${open ? " is-open" : ""}`} aria-labelledby={`acc-${id}-btn`}>
      <button
        id={`acc-${id}-btn`}
        className="acc__btn"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span>{title}</span>
        <span className="acc__caret" aria-hidden>▾</span>
      </button>
      <div className="acc__panel" role="region">
        {open && <div className="acc__inner">{content}</div>}
      </div>
    </section>
  );
}
