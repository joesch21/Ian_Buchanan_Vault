/* eslint-env node */
/* global process */
import { createBranch, openPR, putFileOnBranch } from './_github.js';

const FILES = {
  concepts: 'site/public/data/concepts.json',
  scholars: 'site/public/data/scholars.json'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok:false, error:'POST required' }); return;
  }

  const { kind, payload, message, direct } = await readJson(req);
  const filepath = FILES[kind];
  if (!filepath) { res.status(400).json({ ok:false, error:'Unknown kind' }); return; }

  const isProd = process.env.VERCEL_ENV === 'production';
  const preferDirect = direct || process.env.GITHUB_COMMIT_MODE === 'direct';

  try {
    if (!isProd) {
      // dev: write to fs like before for convenience
      const fs = await import('fs'); const path = await import('path');
      const file = path.join(process.cwd(), filepath);
      fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
      res.status(200).json({ ok:true, mode:'dev-fs' });
      return;
    }

    // production: GitHub
    const repo = process.env.GITHUB_REPO;
    if (!process.env.GITHUB_TOKEN || !repo) {
      // Optionally, fall back to Blob here; else fail with message
      res.status(501).json({ ok:false, error:'GitHub not configured in production (GITHUB_TOKEN,GITHUB_REPO).' });
      return;
    }

    const base = process.env.GITHUB_DEFAULT_BRANCH || 'main';
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    const branch = `vault/update-${kind}-${stamp}`;

    if (!preferDirect) {
      await createBranch(base, branch);
      await putFileOnBranch(branch, filepath, payload, message || `Update ${kind}.json via UI`);
      const pr = await openPR(branch, base, `Vault: update ${kind}.json`, `Automated update from Vault UI at ${new Date().toISOString()}`);
      res.status(200).json({ ok:true, mode:'github-pr', url: pr.html_url });
      return;
    } else {
      // Direct commit onto base (less safe)
      await putFileOnBranch(base, filepath, payload, message || `Update ${kind}.json via UI`);
      res.status(200).json({ ok:true, mode:'github-direct', url:`https://github.com/${repo}/commits/${base}` });
      return;
    }
  } catch (e) {
    res.status(500).json({ ok:false, error: String(e.message || e) });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data=''; req.on('data', c=> data+=c);
    req.on('end', ()=> { try { resolve(JSON.parse(data||'{}')); } catch(e){ reject(e); }});
  });
}
