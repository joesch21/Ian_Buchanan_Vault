import { NODE_COLORS, EDGE_COLORS } from '../utils/cartographySchema';

export default function LegendFilters() {
  return (
    <div className="legend">
      <div className="legend-row">
        <span className="chip" style={{ background: NODE_COLORS.concept }} /> Concept
        <span className="chip" style={{ background: NODE_COLORS.scholar }} /> Scholar
        <span className="chip" style={{ background: NODE_COLORS.work }} /> Work
      </div>
      <div className="legend-row">
        <span className="chip" style={{ background: EDGE_COLORS.aligns }} /> Aligns
        <span className="chip" style={{ background: EDGE_COLORS.diverges }} /> Diverges
        <span className="chip" style={{ background: EDGE_COLORS.cites }} /> Cites
      </div>
    </div>
  );
}
