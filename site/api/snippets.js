/* eslint-env node */
import { promises as fs } from 'fs';
import path from 'path';
import process from 'node:process';

const conceptsPath = path.join(process.cwd(), 'public', 'data', 'concepts.json');
const scholarsPath = path.join(process.cwd(), 'public', 'data', 'scholars.json');

async function loadConceptTerms(term) {
  try {
    const txt = await fs.readFile(conceptsPath, 'utf8');
    const data = JSON.parse(txt);
    const c = data.find(x => x.term.toLowerCase() === term.toLowerCase());
    if (c) return [c.term, ...(c.aliases || [])];
  } catch { /* ignore */ }
  return [term];
}

async function loadScholarMap() {
  try {
    const txt = await fs.readFile(scholarsPath, 'utf8');
    const arr = JSON.parse(txt);
    const m = new Map();
    arr.forEach(s => m.set(s.orcid, s.name));
    return m;
  } catch {
    return new Map();
  }
}

function parseCSV(txt) {
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split(',').map(h => h.replace(/^"|"$/g,''));
  return lines.map(line => {
    const cols = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    const o = {};
    headers.forEach((h,i)=> o[h] = (cols[i]||'').replace(/^"|"$/g,'').replace(/""/g,'"'));
    return o;
  });
}

async function loadWorks(orcid) {
  const csvPath = path.join(process.cwd(), 'public', 'data', `${orcid}.csv`);
  try {
    const txt = await fs.readFile(csvPath, 'utf8');
    return parseCSV(txt);
  } catch {
    // fallback to ORCID API
    try {
      const base = `https://pub.orcid.org/v3.0/${orcid}`;
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'IanBuchananVault/1.0'
      };
      const worksResp = await fetch(`${base}/works`, { headers });
      if (!worksResp.ok) throw new Error('works fetch failed');
      const works = await worksResp.json();
      const summaries = (works?.group || []).flatMap(g => g['work-summary'] || []);
      const detailPromises = summaries.map(s =>
        fetch(`${base}/work/${s['put-code']}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      );
      const details = (await Promise.all(detailPromises)).filter(Boolean);
      return details.map(w => ({
        title: w?.title?.title?.value || '',
        year: w?.['publication-date']?.year?.value || '',
        journal_or_publisher: w?.['journal-title']?.value || w?.publisher || '',
        doi: (w?.['external-ids']?.['external-id'] || [])
          .find(e => e?.['external-id-type']?.toLowerCase() === 'doi')?.['external-id-value'] || '',
        url: (w?.['external-ids']?.['external-id'] || [])
          .find(e => e?.['external-id-type']?.toLowerCase() === 'uri')?.['external-id-value'] || ''
      }));
    } catch {
      return [];
    }
  }
}

function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export default async function handler(req, res) {
  const { concept = '', orcids = '', yearMin, yearMax } = req.method === 'GET' ? req.query : req.body;
  const ids = Array.isArray(orcids) ? orcids : orcids.split(',').map(s => s.trim()).filter(Boolean);

  const terms = await loadConceptTerms(concept);
  const regex = new RegExp(terms.map(t => escapeRegExp(t)).join('|'), 'i');
  const yearMinNum = yearMin ? Number(yearMin) : -Infinity;
  const yearMaxNum = yearMax ? Number(yearMax) : Infinity;
  const scholarMap = await loadScholarMap();

  const hits = [];
  for (const id of ids) {
    const works = await loadWorks(id);
    let count = 0;
    for (const w of works) {
      if (count >= 2) break; // limit per scholar
      const y = Number(w.year);
      if (Number.isFinite(y) && (y < yearMinNum || y > yearMaxNum)) continue;
      const fields = ['title','journal_or_publisher'];
      for (const f of fields) {
        const val = (w[f] || '').toString();
        const m = val.match(regex);
        if (m) {
          const snip = val.slice(Math.max(0, m.index - 40), m.index + 40);
          hits.push({
            orcid: id,
            author: scholarMap.get(id) || id,
            work_title: w.title || '',
            year: w.year || '',
            venue: w.journal_or_publisher || '',
            doi: w.doi || '',
            url: w.url || '',
            match_field: f,
            snippet: snip,
            context: val
          });
          count += 1;
          break;
        }
      }
    }
  }

  res.status(200).json({ ok: true, concept, hits });
}
