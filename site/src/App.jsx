import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Bibliography from './pages/Bibliography.jsx';
import Compare from './pages/Compare.jsx';
import About from './pages/About.jsx';
import Cartography from './pages/Cartography.tsx';
import Trainer from './pages/Trainer.jsx';
import Instructions from './pages/Instructions.jsx';

export default function App() {
  return (
    <div className="container">
      <h1>Ian Buchanan Vault</h1>
      <nav style={{ marginBottom: '1rem' }}>
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>{' | '}
        <NavLink to="/bibliography" className={({isActive}) => isActive ? 'active' : ''}>Bibliography</NavLink>{' | '}
        <NavLink to="/compare" className={({isActive}) => isActive ? 'active' : ''}>Compare</NavLink>{' | '}
        <NavLink to="/cartography" className={({isActive}) => isActive ? 'active' : ''}>Cartography</NavLink>{' | '}
        <NavLink to="/instructions" className={({isActive}) => isActive ? 'active' : ''}>Instructions</NavLink>{' | '}
        <NavLink to="/trainer" className={({isActive}) => isActive ? 'active' : ''}>Trainer</NavLink>{' | '}
        <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>About</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bibliography" element={<Bibliography />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/cartography" element={<Cartography />} />
        <Route path="/graph" element={<Navigate to="/cartography" replace />} />
        <Route path="/trainer" element={<Trainer />} />
        <Route path="/about" element={<About />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
function NotFound(){ return <h2>404 — Page Not Found</h2>; }
