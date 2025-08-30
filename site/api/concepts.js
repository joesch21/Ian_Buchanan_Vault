/* eslint-env node */
import { promises as fs } from 'fs';
import path from 'path';
import process from 'node:process';

const filePath = path.join(process.cwd(), 'public', 'data', 'concepts.json');

function normalizeConcept(c = {}) {
  return {
    term: (c.term || '').trim(),
    aliases: Array.isArray(c.aliases) ? c.aliases.map(a => a.trim()).filter(Boolean) : [],
    definition: (c.definition || '').trim(),
    notes: (c.notes || '').trim(),
    seed_quotes: Array.isArray(c.seed_quotes) ? c.seed_quotes.map(q => ({
      text: (q.text || '').trim(),
      source: (q.source || '').trim(),
      url: (q.url || '').trim(),
      year: q.year || ''
    })).filter(q => q.text) : [],
    tags: Array.isArray(c.tags) ? c.tags.map(t => t.trim()).filter(Boolean) : []
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      res.status(200).json(JSON.parse(txt));
    } catch {
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(body)) throw new Error('Expected an array');
      const clean = body.map(normalizeConcept).filter(c => c.term);
      // ensure unique terms
      const seen = new Set();
      for (const c of clean) {
        const key = c.term.toLowerCase();
        if (seen.has(key)) {
          return res.status(400).json({ ok: false, error: `Duplicate term: ${c.term}` });
        }
        seen.add(key);
      }
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(clean, null, 2));
      res.status(200).json({ ok: true, count: clean.length });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
}
