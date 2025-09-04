import { useEffect, useState } from 'react';
import HeroHeader from './components/HeroHeader.jsx';
import PromptBar from './components/PromptBar.jsx';
import GraphCanvas from './components/GraphCanvas.jsx';
import NodeDrawer from './components/NodeDrawer.jsx';
import LegendFilters from './components/LegendFilters.jsx';
import useCartographyApi from './hooks/useCartographyApi.js';
import { DEFAULT_PAYLOAD } from './utils/cartographySchema.js';
import './cartography.css';

export default function CartographyPage() {
  const api = useCartographyApi();
  const [graph, setGraph] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const cached = api.readCache();
    if (cached) {
      setGraph(cached);
    } else {
      api.compile(DEFAULT_PAYLOAD, { allowMock: true }).then(g => setGraph(g));
    }
  }, [api]);

  const handleExplore = async spec => {
    setLoading(true);
    try {
      const payload = { ...DEFAULT_PAYLOAD, ...spec };
      const g = await api.compile(payload);
      setGraph(g);
      setWarning(g.warning || '');
    } catch (e) {
      setWarning(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cartography-page">
      <HeroHeader />
      <PromptBar onExplore={handleExplore} />
      {warning && <div className="warning">{warning}</div>}
      <LegendFilters />
      <div className="canvas-wrap">
        {loading && <div className="loading">Loading…</div>}
        <GraphCanvas graph={graph} onSelectNode={setSelected} />
      </div>
      <NodeDrawer node={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
