import GuideAccordion from "@/components/GuideAccordion";
import "@/styles/graph.css";

export default function Instructions() {
  return (
    <div className="page">
      <h1>Instructions</h1>
      <p>How to use the Buchanan Vault and Scholarly Cartography.</p>
      <GuideAccordion mode="full" />
    </div>
  );
}
