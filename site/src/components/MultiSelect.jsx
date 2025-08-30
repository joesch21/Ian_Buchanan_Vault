import { useEffect, useMemo, useRef, useState } from 'react';

export default function MultiSelect({
  label,
  items,
  idKey,
  labelKey,
  selected,        // Set<string>
  onChange        // (Set<string>) => void
}) {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function onDoc(e){
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  }, [open]);

  const list = items ?? [];
  const count = useMemo(() => {
    let c = 0;
    for (const it of list) if (selected.has(it[idKey])) c++;
    return c;
  }, [list, selected, idKey]);

  function toggleOne(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  }

  function selectAllGroup() {
    const next = new Set(selected);
    for (const it of list) next.add(it[idKey]);        // UNION (not overwrite)
    onChange(next);
  }

  function noneGroup() {
    if (!list.length) return;
    const ids = new Set(list.map(it => it[idKey]));
    const next = new Set(Array.from(selected).filter(x => !ids.has(x))); // remove only this group's
    onChange(next);
  }

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button
        className="btn"
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {label} {count ? `(${count})` : ''}
      </button>

      {open && (
        <div
          ref={popRef}
          role="listbox"
          style={{
            position:'absolute', zIndex:10, minWidth:260, maxWidth:340,
            maxHeight:360, overflow:'auto', padding:8, background:'#fff',
            border:'1px solid #ddd', boxShadow:'0 6px 14px rgba(0,0,0,.08)'
          }}
          // Prevent clicks inside from bubbling to parent (iOS safety)
          onMouseDown={(e)=>e.stopPropagation()}
          onClick={(e)=>e.stopPropagation()}
        >
          <div style={{display:'flex', gap:8, marginBottom:6}}>
            <button className="btn" type="button" onClick={selectAllGroup}>Select all</button>
            <button className="btn" type="button" onClick={noneGroup}>None</button>
          </div>

          {list.map(it => {
            const id = it[idKey];
            const name = it[labelKey];
            const active = selected.has(id);
            return (
              <div
                key={id}
                role="option"
                aria-selected={active}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'6px 4px', cursor:'pointer'
                }}
                onClick={(e) => { e.preventDefault(); toggleOne(id); }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleOne(id)}
                  onClick={(e)=>e.stopPropagation()}
                />
                <span>{name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

