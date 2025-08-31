export const guide = {
  philosophical: `
Think of each node (scholar, work, concept) as a **component of an assemblage**. 
Edges are **intensities/relations**: how concepts like *assemblage*, *affect*, or *becoming* circulate across texts.
This is a **rhizome**: not a tree with roots and branches, but a mesh of partial connections that can be cut, spliced, and rejoined.
Use the map *cartographically*: to trace **lines of flight**, not to prove essences.
`,

  practical: `
**Select Scholars** via ORCID or the dropdown.  
**Select Concepts** (assemblage, affect, deterritorialization…).  
**Adjust Parameters** (year range, concept frequency, highlight ORCID).  
**Compile** to generate the graph. Click nodes to open DOI/publisher; open the “References by code” drawer to cite.
`,

  cartography: `
**Reading the graph**  
• **Authors** (blue), **Works** (gray), **Concepts** (gold).  
• **Authored** edges connect author → work; **Concept** edges connect concept → work; **Co-author** and **Influence** edges appear in those modes.  
• Codes like **IB-15** = initials + year; **#ASS** = concept tag (Assemblage).

**Use as Cartography**  
• Compare concepts by filtering edges to #ASS vs #AFF.  
• Trace lineages by watching **influence** edges move forward in time.  
• Find clusters: raise min concept freq to de-noise; co-work mode shows author clusters.
`
};
