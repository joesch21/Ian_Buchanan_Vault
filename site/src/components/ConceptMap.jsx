import React, { useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

export default function ConceptMap({ data }) {
  const graphData = useMemo(() => {
    const nodes = []
    const links = []
    // tag nodes
    const tagSet = new Set()
    data.forEach(work => {
      work.tags.forEach(tag => tagSet.add(tag))
    })
    for (const tag of tagSet) {
      nodes.push({ id: `tag-${tag}`, name: tag, type: 'tag' })
    }

    // work nodes + links
    data.forEach(work => {
      const nodeId = `work-${work.id}`
      nodes.push({ id: nodeId, name: work.title, type: work.type, year: work.year })
      work.tags.forEach(tag => {
        links.push({ source: nodeId, target: `tag-${tag}` })
      })
    })

    return { nodes, links }
  }, [data])

  return (
    <div style={{ height: '600px', background:'#0f1115', borderRadius:'8px' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="type"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Sans-Serif`
          ctx.fillStyle = node.type === 'tag' ? '#ccc' :
            node.type === 'Book' ? '#4C9AFF' :
            node.type === 'Edited volume' ? '#FFB020' :
            node.type === 'Article' ? '#34C759' : '#aaa'
          ctx.beginPath()
          ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false)
          ctx.fill()
          ctx.fillStyle = 'white'
          ctx.fillText(label, node.x + 8, node.y + 4)
        }}
        linkColor={() => '#555'}
      />
    </div>
  )
}

