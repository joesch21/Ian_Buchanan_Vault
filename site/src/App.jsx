import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Bibliography from './pages/Bibliography.jsx';
import Compare from './pages/Compare.jsx';
import Graph from './pages/Graph.jsx';
import Concepts from './pages/Concepts.jsx';
import ConceptCompare from './pages/ConceptCompare.jsx';
import Formatting from './pages/Formatting.jsx';

export default function App() {
  return (
    <div className="container">
      <h1>Ian Buchanan Vault</h1>
      <nav style={{ marginBottom: '1rem' }}>
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>{' | '}
        <NavLink to="/bibliography" className={({isActive}) => isActive ? 'active' : ''}>Bibliography</NavLink>{' | '}
        <NavLink to="/compare" className={({isActive}) => isActive ? 'active' : ''}>Compare</NavLink>{' | '}
        <NavLink to="/graph" className={({isActive}) => isActive ? 'active' : ''}>Graph</NavLink>{' | '}
        <NavLink to="/concepts" className={({isActive}) => isActive ? 'active' : ''}>Concepts</NavLink>
        {' | '}<NavLink to="/formatting" className={({isActive}) => isActive ? 'active' : ''}>Formatting</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bibliography" element={<Bibliography />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/graph" element={<Graph />} />
        <Route path="/concepts" element={<Concepts />} />
        <Route path="/concepts/compare" element={<ConceptCompare />} />
        <Route path="/formatting" element={<Formatting />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
function NotFound(){ return <h2>404 — Page Not Found</h2>; }
