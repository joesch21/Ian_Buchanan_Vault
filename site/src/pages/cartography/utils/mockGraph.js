export default {
  nodes: [
    { id: 'concept:assemblage', type: 'concept', label: 'Assemblage', explanation: 'Assemblage theory explores how heterogeneous elements come together.' },
    { id: 'concept:affect', type: 'concept', label: 'Affect', explanation: 'Affect considers pre-personal intensity and experience.' },
    { id: 'scholar:buc', type: 'scholar', label: 'Ian Buchanan' },
    { id: 'scholar:mass', type: 'scholar', label: 'Brian Massumi' },
    { id: 'scholar:delanda', type: 'scholar', label: 'Manuel DeLanda' }
  ],
  edges: [
    { source: 'scholar:buc', target: 'concept:assemblage', alignment: 'aligns', weight: 2, type: 'concept' },
    { source: 'scholar:mass', target: 'concept:affect', alignment: 'diverges', weight: 1, type: 'concept' },
    { source: 'scholar:delanda', target: 'concept:assemblage', alignment: 'cites', weight: 1, type: 'concept' }
  ]
};
