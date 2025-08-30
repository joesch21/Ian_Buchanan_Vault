/* eslint-env node */
import { promises as fs } from 'fs';
import path from 'path';
import process from 'node:process';

const filePath = path.join(process.cwd(), 'public', 'data', 'scholars.json');

function isValidOrcid(id) {
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(id);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(txt);
      res.status(200).json(data);
    } catch {
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(body)) throw new Error('Expected an array');
      const clean = body.map(s => ({
        name: (s.name || '').trim(),
        orcid: (s.orcid || '').trim()
      })).filter(s => s.name);
      for (const s of clean) {
        if (s.orcid && !isValidOrcid(s.orcid)) {
          return res.status(400).json({ ok: false, error: `Invalid ORCID for ${s.name}` });
        }
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
