/* eslint-env node */
import fs from 'fs';
import path from 'path';
import process from 'node:process';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'POST required' });
    return;
  }

  try {
    const { concept, orcids = [], yearMin, yearMax, aliases = [] } = await readJson(req);
    if (!concept || !orcids.length) {
      res.status(400).json({ ok: false, error: 'concept and orcids[] required' });
      return;
    }

    const terms = new Set([concept.toLowerCase(), ...aliases.map(a => a.toLowerCase())]);

    const hits = [];
    for (const id of orcids) {
      const csvPath = path.join(process.cwd(), 'site', 'public', 'data', `${id}.csv`);
      if (!fs.existsSync(csvPath)) continue;
      const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
      for (const r of rows) {
        const y = Number(r.year);
        if (Number.isFinite(y)) {
          if (Number.isFinite(Number(yearMin)) && y < Number(yearMin)) continue;
          if (Number.isFinite(Number(yearMax)) && y > Number(yearMax)) continue;
        }
        const fields = [
          safe(r.title), safe(r.abstract), safe(r.journal_or_publisher)
        ].filter(Boolean);
        const joined = fields.join(' \n').toLowerCase();
        const match = [...terms].find(t => t && joined.includes(t));
        if (match) {
          hits.push({
            orcid: id,
            author: r.author_name || id,
            work_title: r.title || '(untitled)',
            year: r.year || '',
            venue: r.journal_or_publisher || '',
            doi: r.doi || '',
            url: r.url || '',
            match_field: 'text',
            snippet: makeSnippet(joined, match)
          });
        }
        if (hits.length > 40) break; // cap
      }
    }

    res.status(200).json({ ok: true, concept, hits });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { reject(e); }
    });
  });
}

function safe(x) { return (x ?? '').toString(); }

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = splitCSV(lines[0]);
  return lines.slice(1).map(line => {
    const cols = splitCSV(line);
    const o = {};
    headers.forEach((h, i) => o[h] = cols[i] || '');
    return o;
  });
}

function splitCSV(line) {
  // simple CSV splitter with quotes
  const re = /("([^"]|"")*"|[^,]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push((m[1] || '').replace(/^"|"$/g, '').replace(/""/g, '"'));
  }
  return out;
}

function makeSnippet(text, term) {
  const i = text.indexOf(term);
  if (i < 0) return '';
  const start = Math.max(0, i - 80);
  const end = Math.min(text.length, i + term.length + 120);
  return text.slice(start, end).replace(/\s+/g, ' ').trim() + ' …';
}
