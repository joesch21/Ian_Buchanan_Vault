import { useState } from 'react';
import { parseCSV } from '../../lib/csvUtils.js';
import { mergeItems } from '../../lib/biblioStore.js';

export default function ImportMergePanel(){
  const [text, setText] = useState('');
  const handle = () => {
    const items = parseCSV(text);
    mergeItems(items);
    setText('');
    alert(`Merged ${items.length} items`);
  };
  return (
    <div>
      <h3>Import &amp; Merge</h3>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} cols={20} />
      <button onClick={handle}>Merge</button>
    </div>
  );
}
