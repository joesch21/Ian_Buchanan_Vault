import { Routes, Route, Link } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Ian Buchanan Vault</h1>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

function Home() {
  return <h2>Home Page</h2>
}

function About() {
  return <h2>About this project</h2>
}

function NotFound() {
  return <h2>404 — Page Not Found</h2>
}
