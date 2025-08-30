import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Bibliography from './pages/Bibliography.jsx';
import Compare from './pages/Compare.jsx';
import About from './pages/About.jsx';
import Graph from './pages/Graph.jsx';

export default function App() {
  return (
    <div className="container">
      <h1>Ian Buchanan Vault</h1>
      <nav style={{ marginBottom: '1rem' }}>
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>{' | '}
        <NavLink to="/bibliography" className={({isActive}) => isActive ? 'active' : ''}>Bibliography</NavLink>{' | '}
        <NavLink to="/compare" className={({isActive}) => isActive ? 'active' : ''}>Compare</NavLink>{' | '}
        <NavLink to="/graph" className={({isActive}) => isActive ? 'active' : ''}>Graph</NavLink>{' | '}
        <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>About</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bibliography" element={<Bibliography />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/graph" element={<Graph />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
function NotFound(){ return <h2>404 — Page Not Found</h2>; }
