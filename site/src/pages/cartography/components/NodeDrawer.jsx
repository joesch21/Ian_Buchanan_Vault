export default function NodeDrawer({ node, onClose }) {
  if (!node) return null;

  const askKnow = () => {
    window.dispatchEvent(
      new CustomEvent('know:open', {
        detail: {
          siteId: 'buchanan-vault',
          prompt: node.knowPrompt || `Explain ${node.label} with 2–3 sources.`,
          context: {}
        }
      })
    );
  };

  const saveTrainer = () => {
    window.dispatchEvent(
      new CustomEvent('trainer:prefill', {
        detail: {
          title: node.label,
          type: node.type,
          body: node.explanation || '',
          sources: node.sources || []
        }
      })
    );
  };

  return (
    <aside className="node-drawer">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <h2>
        {node.label} <span className="badge">{node.type}</span>
      </h2>
      {node.explanation && <p>{node.explanation}</p>}
      {node.sources && node.sources.length > 0 && (
        <ul className="sources">
          {node.sources.map((s, i) => (
            <li key={i}>
              <a
                href={s.url || (s.doi ? `https://doi.org/${s.doi}` : '#')}
                target="_blank"
                rel="noopener"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button onClick={askKnow}>Ask Know</button>
        <button onClick={saveTrainer}>Save to Trainer</button>
      </div>
    </aside>
  );
}
