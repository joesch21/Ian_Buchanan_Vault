export const biblioStore = {
  items: [],
  selected: [],
  tags: [],
  notes: {}
};

export function loadWorks(works) {
  biblioStore.items = works;
}

export function toggleSelect(id) {
  const idx = biblioStore.selected.indexOf(id);
  if (idx === -1) biblioStore.selected.push(id);
  else biblioStore.selected.splice(idx, 1);
}

export function mergeItems(newItems) {
  const byId = new Map(biblioStore.items.map(it => [it.id, it]));
  newItems.forEach(it => {
    if (byId.has(it.id)) Object.assign(byId.get(it.id), it);
    else biblioStore.items.push(it);
  });
}
