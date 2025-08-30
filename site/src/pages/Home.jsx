import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <h2>Welcome</h2>
      <p>The Ian Buchanan Vault curates a master bibliography and comparative tools for Deleuze &amp; Guattari studies.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
        <Link className="btn primary" to="/bibliography">View Bibliography</Link>
        <Link className="btn" to="/compare">Compare Authors</Link>
      </div>
    </div>
  );
}
