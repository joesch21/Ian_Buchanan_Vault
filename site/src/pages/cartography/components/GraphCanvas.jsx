import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NODE_COLORS, EDGE_COLORS, NODE_SHAPES } from '../utils/cartographySchema';

export default function GraphCanvas({ graph, onSelectNode }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!graph || !ref.current) return;
    const el = ref.current;
    const { nodes, edges } = graph;
    const width = el.clientWidth || 600;
    const height = el.clientHeight || 400;

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    svg.call(
      d3.zoom().on('zoom', event => {
        g.attr('transform', event.transform);
      })
    );

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(20));

    const link = g
      .append('g')
      .attr('stroke', '#ccc')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', d => EDGE_COLORS[d.alignment] || '#999')
      .attr('stroke-width', d => 1 + (d.weight || 1));

    link
      .append('title')
      .text(d => `${d.source} ${d.type} ${d.target} (w=${d.weight})`);

    const node = g
      .append('g')
      .selectAll('path')
      .data(nodes)
      .enter()
      .append('path')
      .attr('d', d => {
        const shape = NODE_SHAPES[d.type] || 'circle';
        const symbol =
          shape === 'square'
            ? d3.symbolSquare
            : shape === 'diamond'
            ? d3.symbolDiamond
            : d3.symbolCircle;
        return d3.symbol().type(symbol).size(200)();
      })
      .attr('fill', d => NODE_COLORS[d.type] || '#aaa')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_, d) => onSelectNode && onSelectNode(d));

    simulation.on('tick', () => {
      g.selectAll('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      svg.remove();
    };
  }, [graph, onSelectNode]);

  return <div className="graph-canvas" ref={ref} />;
}
