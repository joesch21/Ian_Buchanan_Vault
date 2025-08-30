import { biblioStore } from '../../lib/biblioStore.js';
import { toWiki } from '../../lib/citeExport.js';

export default function WikiBlockPanel(){
  const text = biblioStore.items.map(toWiki).join('\n');
  const copy = () => navigator.clipboard?.writeText(text);
  return (
    <div>
      <h3>Wikipedia Block</h3>
      <pre style={{whiteSpace:'pre-wrap'}}>{text}</pre>
      <button onClick={copy}>Copy</button>
    </div>
  );
}
