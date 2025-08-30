export function stableId(title, year){
  return `${title}-${year}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
