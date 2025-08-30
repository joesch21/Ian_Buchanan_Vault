/* eslint-env node */
/* global process Buffer */

export async function ghRequest(path, init = {}) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new Error('GitHub not configured.');

  const url = `https://api.github.com/repos/${repo}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Buchanan-Vault',
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`GitHub ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getBranchSha(branch) {
  const data = await ghRequest(`git/ref/heads/${branch}`);
  return data.object.sha;
}

export async function getFileSha(branch, path) {
  try {
    const file = await ghRequest(`contents/${path}?ref=${branch}`);
    return file.sha;
  } catch {
    return null;
  }
}

export async function createBranch(fromBranch, newBranch) {
  const sha = await getBranchSha(fromBranch);
  return ghRequest('git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha })
  });
}

export async function putFileOnBranch(branch, filepath, contentJson, message) {
  const content = Buffer.from(JSON.stringify(contentJson, null, 2)).toString('base64');
  const sha = await getFileSha(branch, filepath);
  return ghRequest(`contents/${filepath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(sha ? { sha } : {})
    })
  });
}

export async function openPR(fromBranch, toBranch, title, body) {
  return ghRequest('pulls', {
    method: 'POST',
    body: JSON.stringify({ head: fromBranch, base: toBranch, title, body })
  });
}
