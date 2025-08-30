import { biblioStore } from '../lib/biblioStore.js';
import { toAPA, toChicago, toHarvard, toBibTeX, toRIS, toMarkdown, toWiki } from '../lib/citeExport.js';

export default function Formatting(){
  const items = biblioStore.selected.map(id => biblioStore.items.find(it => it.id === id)).filter(Boolean);
  if (!items.length) return <div className="container"><p>No items selected.</p></div>;
  return (
    <div className="container">
      <h2>Formatting</h2>
      {items.map(it => (
        <div key={it.id} className="fmt-item">
          <p><strong>{it.title}</strong> ({it.year})</p>
          <pre>{toAPA(it)}</pre>
          <pre>{toChicago(it)}</pre>
          <pre>{toHarvard(it)}</pre>
          <pre>{toBibTeX(it)}</pre>
          <pre>{toRIS(it)}</pre>
          <pre>{toMarkdown(it)}</pre>
          <pre>{toWiki(it)}</pre>
        </div>
      ))}
    </div>
  );
}
