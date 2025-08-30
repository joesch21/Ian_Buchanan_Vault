import Papa from 'papaparse';

export function parseCSV(text){
  const res = Papa.parse(text.trim(), { header: true });
  return res.data.filter(row => row && row.title);
}
