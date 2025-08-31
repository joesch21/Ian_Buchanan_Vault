import Accordion from "@/components/Accordion";
import "@/components/accordion.css";
import AskKnowInline from "@/components/AskKnowInline";
import "@/components/askKnowInline.css";

export default function Instructions() {
  const items = [
    {
      id: "philosophy",
      title: "Philosophical Orientation",
      defaultOpen: true,
      content: (
        <>
          <p>
            This graph is not a family tree or a linear timeline. It is a <span className="highlight">rhizome</span>:
            a network of connections without hierarchy. Each time you compile the graph, you generate a
            <span className="highlight"> cartography</span> — a map of relations in motion.
          </p>
          <p>
            Think of each node (scholar, work, concept) as a <span className="highlight">component of an assemblage</span>.
            Edges trace intensities: how concepts like <span className="highlight">assemblage</span>, affect, or becoming circulate across texts.
          </p>
          <AskKnowInline
            seed="Explain how a rhizome differs from a tree in this visualization."
            context="You are the Know assistant for the Buchanan Vault. The user is reading the 'Philosophical Orientation' section of the Instructions page about the Rhizome Graph."
          />
        </>
      )
    },
    {
      id: "practical",
      title: "Practical Steps",
      content: (
        <>
          <ul>
            <li><b>Select Scholars:</b> Use the dropdown to choose key figures.</li>
            <li><b>Select Concepts:</b> Pick central Deleuzian terms (assemblage, affect, deterritorialization...).</li>
            <li><b>Adjust Parameters:</b> Year range, frequency, highlight ORCID.</li>
            <li><b>Compile:</b> Press <i>Compile</i> to generate the rhizome.</li>
          </ul>
          <AskKnowInline
            seed="What settings should I try to see assemblage between 2000–2010?"
            context="You are the Know assistant for the Buchanan Vault. The user is in the 'Practical Steps' section and wants parameter guidance."
          />
        </>
      )
    },
    {
      id: "reading",
      title: "Reading the Graph",
      content: (
        <>
          <p>
            <b>Nodes:</b> 🟦 Scholar · ⚪ Work · 🟨 Concept<br/>
            <b>Edges:</b> co-authorship, citation, or conceptual overlap.<br/>
            <b>Clusters:</b> Intensities may indicate <span className="highlight">lines of flight</span>.
          </p>
          <AskKnowInline
            seed="How do I interpret clusters of affect-related works?"
            context="The user is studying 'Reading the Graph' and needs help interpreting clusters."
          />
        </>
      )
    },
    {
      id: "cartography",
      title: "Using the Graph as Cartography",
      content: (
        <>
          <ul>
            <li>Vary filters — each selection produces a <span className="highlight">different rhizome</span>.</li>
            <li>Look for <span className="highlight">connections, overlaps, divergences</span> rather than origins.</li>
            <li>Pose new research questions (e.g., where does 'affect' drop out after 2015?).</li>
          </ul>
          <AskKnowInline
            seed="Suggest three research questions to explore with the current graph."
            context="User is in 'Cartography'; propose research questions grounded in Deleuzian method."
          />
        </>
      )
    }
  ];

  return (
    <div className="page">
      <h1>📖 Instructions: How to Use the Rhizome Graph</h1>
      <Accordion items={items} />
    </div>
  );
}
