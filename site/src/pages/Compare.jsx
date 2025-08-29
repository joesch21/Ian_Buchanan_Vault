import React, { useState } from 'react'

export default function Compare() {
  const [a, setA] = useState('buchanan')
  const [b, setB] = useState('massumi')

  return (
    <div className="container">
      <h1>Compare Scholars (beta)</h1>
      <div className="controls">
        <select value={a} onChange={e => setA(e.target.value)}>
          <option value="buchanan">Buchanan</option>
          <option value="massumi">Massumi</option>
          <option value="colebrook">Colebrook</option>
          <option value="delanda">DeLanda</option>
        </select>
        <span className="badge">vs</span>
        <select value={b} onChange={e => setB(e.target.value)}>
          <option value="buchanan">Buchanan</option>
          <option value="massumi">Massumi</option>
          <option value="colebrook">Colebrook</option>
          <option value="delanda">DeLanda</option>
        </select>
      </div>
      <p className="small-muted">Coming soon: load a second dataset (Massumi, Colebrook) and compare counts per concept and year.</p>
    </div>
  )
}
