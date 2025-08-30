/* eslint-env node */
import fs from 'fs';
import path from 'path';
import process from 'node:process';

export default async function handler(req, res) {
  const file = path.join(process.cwd(), 'site', 'public', 'data', 'concepts.json');

  if (req.method === 'GET') {
    try {
      const buf = fs.readFileSync(file, 'utf8');
      res.status(200).json(JSON.parse(buf));
    } catch {
      res.status(200).json([]); // empty list fallback
    }
    return;
  }

  if (req.method === 'POST') {
    // Writing in Vercel production is not supported (read-only FS).
    if (process.env.VERCEL_ENV === 'production') {
      res.status(501).json({ ok: false, error: 'Write not supported in production. Use GitHub/Blob storage.' });
      return;
    }
    try {
      const body = await readJson(req);
      if (!Array.isArray(body)) throw new Error('Body must be an array');
      fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8');
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(400).json({ ok: false, error: String(e.message || e) });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '[]')); }
      catch (e) { reject(e); }
    });
  });
}
