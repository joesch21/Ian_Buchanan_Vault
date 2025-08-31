import { useEffect, useMemo, useState } from 'react';

export type Option = { value: string; label: string };
type Props = {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxHeight?: number;
};

export default function ChipSelect({
  label, options, selected, onChange, placeholder = 'Type to filter…', maxHeight = 220
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter(o => o.label.toLowerCase().includes(s)) : options;
  }, [q, options]);

  const toggle = (v: string) => {
    const has = selected.includes(v);
    const next = has ? selected.filter(x => x !== v) : [...selected, v];
    onChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="chipsel">
      <label className="chipsel__label">{label}</label>
      <div className="chipsel__ctrl" onClick={() => setOpen(v => !v)}>
        <div className="chipsel__chips">
          {selected.length === 0 && <span className="chipsel__placeholder">None</span>}
          {selected.map(v => {
            const lbl = options.find(o => o.value === v)?.label || v;
            return (
              <button
                key={v}
                type="button"
                className="chipsel__chip chipsel__chip--selected"
                onClick={(e) => { e.stopPropagation(); toggle(v); }}
                aria-pressed="true"
              >
                {lbl} <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
        <span className="chipsel__caret" aria-hidden>▾</span>
      </div>

      {open && (
        <div className="chipsel__panel" role="listbox" style={{ maxHeight }}>
          <input
            className="chipsel__search"
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="chipsel__list">
            {filtered.map(o => {
              const active = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`chipsel__option${active ? ' is-active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

