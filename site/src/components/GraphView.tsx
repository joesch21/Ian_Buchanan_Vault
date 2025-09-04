import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const NODE_COLORS: Record<string,string> = {
  concept: '#2F80ED',
  scholar: '#27AE60',
  work: '#9B51E0'
};

export const EDGE_COLORS: Record<string,string> = {
  aligns: '#22C55E',
  diverges: '#EF4444',
  cites: '#3B82F6'
};

const NODE_SHAPES: Record<string,string> = {
  concept: 'circle',
  scholar: 'square',
  work: 'diamond'
};

export default function GraphView({ graph, onSelect }: { graph:any; onSelect:(n:any)=>void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!graph || !ref.current) return;
    const el = ref.current;
    const { nodes, edges } = graph;
    const width = el.clientWidth || 600;
    const height = el.clientHeight || 400;

    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g');
    svg.call(d3.zoom().on('zoom', e => g.attr('transform', e.transform)));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d:any)=>d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('collide', d3.forceCollide(20));

    const link = g.append('g').attr('stroke','#ccc')
      .selectAll('line').data(edges).enter().append('line')
      .attr('stroke', (d:any)=>EDGE_COLORS[d.alignment] || '#999')
      .attr('stroke-width', (d:any)=>1 + (d.weight || 1));

    link.append('title').text((d:any)=>`${d.source} ${d.type} ${d.target} (w=${d.weight})`);

    const node = g.append('g').selectAll('path').data(nodes).enter().append('path')
      .attr('d',(d:any)=>{
        const shape = NODE_SHAPES[d.type] || 'circle';
        const symbol = shape==='square'?d3.symbolSquare:shape==='diamond'?d3.symbolDiamond:d3.symbolCircle;
        return d3.symbol().type(symbol).size(200)();
      })
      .attr('fill',(d:any)=>NODE_COLORS[d.type]||'#aaa')
      .call(d3.drag<any,any>()
        .on('start',(event,d)=>{
          if(!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag',(event,d)=>{ d.fx=event.x; d.fy=event.y; })
        .on('end',(event,d)=>{ if(!event.active) simulation.alphaTarget(0); d.fx=null; d.fy=null; })
      )
      .on('click',(_,d)=>onSelect(d));

    simulation.on('tick', () => {
      g.selectAll('line')
        .attr('x1',(d:any)=>d.source.x)
        .attr('y1',(d:any)=>d.source.y)
        .attr('x2',(d:any)=>d.target.x)
        .attr('y2',(d:any)=>d.target.y);
      node.attr('transform',(d:any)=>`translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); svg.remove(); };
  }, [graph, onSelect]);

  return <div className="graph-view" ref={ref}></div>;
}
