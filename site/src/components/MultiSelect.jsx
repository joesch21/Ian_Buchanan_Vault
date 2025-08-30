import { useEffect, useState } from 'react';

export default function MultiSelect({ label, items, idKey, labelKey, selected, onChange }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!items?.length) setOpen(false); }, [items]);

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button className="btn" type="button" onClick={() => setOpen(!open)}>
        {label} {selected.size ? `(${selected.size})` : ''}
      </button>
      {open && (
        <div style={{
          position:'absolute', zIndex:10, minWidth:260, maxWidth:320,
          maxHeight:320, overflow:'auto', padding:8, background:'#fff',
          border:'1px solid #ddd', boxShadow:'0 6px 14px rgba(0,0,0,.08)'
        }}>
          <div style={{display:'flex', gap:8, marginBottom:6}}>
            <button className="btn" onClick={() => onChange(new Set(items.map(x => x[idKey])))}>
              Select all
            </button>
            <button className="btn" onClick={() => onChange(new Set())}>None</button>
          </div>
          {items.map(it => {
            const id = it[idKey];
            const name = it[labelKey];
            const active = selected.has(id);
            return (
              <div key={id} style={{display:'flex', alignItems:'center', gap:8, padding:'4px 0'}}>
                <input type="checkbox" checked={active} onChange={()=>{
                  const next = new Set(selected);
                  active ? next.delete(id) : next.add(id);
                  onChange(next);
                }} />
                <span>{name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
