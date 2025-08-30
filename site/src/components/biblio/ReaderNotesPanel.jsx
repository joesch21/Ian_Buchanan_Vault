import { useState } from 'react';
import { biblioStore } from '../../lib/biblioStore.js';

export default function ReaderNotesPanel(){
  const [note, setNote] = useState(biblioStore.notes.global || '');
  const save = () => {
    biblioStore.notes.global = note;
  };
  return (
    <div>
      <h3>Reader Notes</h3>
      <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} cols={20} />
      <button onClick={save}>Save</button>
    </div>
  );
}
