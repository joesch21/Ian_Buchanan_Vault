export default function BiblioCard({ item }){
  return (
    <div className="biblio-card">
      <div><strong>{item.title || '(untitled)'}</strong></div>
      {item.year && <div>{item.year}</div>}
      {item.publisher && <div>{item.publisher}</div>}
    </div>
  );
}
