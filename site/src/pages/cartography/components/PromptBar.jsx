import { useState } from 'react';

export default function PromptBar({ onExplore }) {
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [years, setYears] = useState({ min: '', max: '' });
  const [group, setGroup] = useState('');

  const submit = e => {
    e.preventDefault();
    onExplore({ query, years, group });
  };

  return (
    <form className="prompt-bar" onSubmit={submit}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Compare a concept across scholars (e.g., ‘affect’ in Buchanan & Massumi)"
      />
      <button type="submit" className="primary">Explore</button>
      <button type="button" className="advanced-toggle" onClick={() => setAdvanced(v => !v)}>
        Advanced
      </button>
      {advanced && (
        <div className="advanced-pop">
          <label>
            Years
            <input type="number" placeholder="min" value={years.min} onChange={e => setYears({ ...years, min: e.target.value })} />
            <input type="number" placeholder="max" value={years.max} onChange={e => setYears({ ...years, max: e.target.value })} />
          </label>
          <label>
            Scholar Group
            <input type="text" value={group} onChange={e => setGroup(e.target.value)} />
          </label>
        </div>
      )}
    </form>
  );
}
