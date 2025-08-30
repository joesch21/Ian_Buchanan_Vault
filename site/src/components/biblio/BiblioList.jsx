import { biblioStore, toggleSelect } from '../../lib/biblioStore.js';
import BiblioCard from './BiblioCard.jsx';

export default function BiblioList({ items }){
  return (
    <ul className="biblio-list">
      {items.map(it => (
        <li key={it.id}>
          <label>
            <input type="checkbox" checked={biblioStore.selected.includes(it.id)} onChange={() => toggleSelect(it.id)} />
            <BiblioCard item={it} />
          </label>
        </li>
      ))}
    </ul>
  );
}
