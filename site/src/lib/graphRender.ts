import * as d3 from "d3";
import type { GraphJSON } from "@/lib/cartography";

export function renderForceGraph(el: HTMLElement, nodes: GraphJSON["nodes"], edges: GraphJSON["edges"]) {
  const width = el.clientWidth || 600;
  const height = el.clientHeight || 480;
  const svg = d3.select(el).append("svg").attr("width", width).attr("height", height);

  const simulation = d3.forceSimulation(nodes as any)
    .force("link", d3.forceLink(edges as any).id((d:any)=>d.id).distance(80))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width/2, height/2));

  const link = svg.append("g")
    .attr("stroke", "#ccc")
    .selectAll("line")
    .data(edges)
    .enter().append("line")
    .attr("stroke-width", 1.2);

  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
    .call(d3.drag<SVGGElement, any>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x; d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
    );

  node.append("circle")
    .attr("r", 6)
    .attr("fill", d => d.type === "author" ? "#C7A43A" : d.type === "concept" ? "#888" : "#69b" )
    .on("click", (_evt, d:any) => { if (d.url) window.open(d.url, "_blank"); });

  node.append("text")
    .text(d => d.code || "")
    .attr("x", 8)
    .attr("y", 4)
    .style("font-size", "10px");

  simulation.on("tick", () => {
    link
      .attr("x1", (d:any) => (d.source as any).x)
      .attr("y1", (d:any) => (d.source as any).y)
      .attr("x2", (d:any) => (d.target as any).x)
      .attr("y2", (d:any) => (d.target as any).y);

    node.attr("transform", (d:any) => `translate(${d.x},${d.y})`);
  });

  return () => { simulation.stop(); svg.remove(); };
}
