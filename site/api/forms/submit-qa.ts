// Vercel Node runtime (for multipart)
export const config = { runtime: "node" };

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Octokit } from "octokit";
import Busboy from "busboy";
import crypto from "crypto";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}
function json(res: VercelResponse, body: any, status = 200) {
  res.status(status).setHeader("Content-Type","application/json").send(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return json(res, { error: "Method not allowed" }, 405);

    // Basic origin/CSRF check
    const allowed = process.env.SUBMIT_ALLOWED_ORIGIN;
    const origin = req.headers.origin || "";
    if (allowed && !origin.startsWith(allowed)) {
      return json(res, { error: "Bad origin" }, 403);
    }

    // Parse multipart form
    const fields: Record<string,string> = {};
    let fileBuf: Buffer | null = null;
    let fileName = "";
    const bb = Busboy({ headers: req.headers });

    const done = new Promise<void>((resolve, reject) => {
      bb.on("file", (_name, file, info) => {
        const { filename } = info;
        const chunks: Buffer[] = [];
        file.on("data", (d: Buffer) => chunks.push(d));
        file.on("end", () => {
          fileBuf = Buffer.concat(chunks);
          fileName = filename || "upload.pdf";
        });
      });
      bb.on("field", (name, val) => { fields[name] = String(val); });
      bb.on("error", reject);
      bb.on("finish", resolve);
    });

    req.pipe(bb);
    await done;

    const question = (fields["question"] || "").trim();
    const answer = (fields["answer"] || "").trim();
    const transcript = (fields["transcript"] || "").trim();
    const tags = (fields["tags"] || "").split(",").map(s=>s.trim()).filter(Boolean);

    if (!question || (!answer && !transcript && !fileBuf)) {
      return json(res, { error: "Provide at least one of: answer, transcript, file" }, 400);
    }

    // Validate file size/type
    if (fileBuf) {
      const maxMb = Number(process.env.MAX_UPLOAD_MB || 20);
      if (fileBuf.byteLength > maxMb * 1024 * 1024) {
        return json(res, { error: `File too large (> ${maxMb}MB)` }, 400);
      }
      const allowed = (process.env.ALLOWED_FILE_TYPES || ".pdf,.txt,.md").split(",").map(s=>s.trim().toLowerCase());
      const ext = "." + (fileName.split(".").pop() || "").toLowerCase();
      if (!allowed.includes(ext)) return json(res, { error: `File type not allowed (${ext})` }, 400);
    }

    // Build entry JSON
    const date = new Date().toISOString().slice(0,10);
    const id = `qa-${date}-${slug(question).slice(0,60)}`;
    const entry: any = {
      id, question,
      answer: answer || transcript || null,
      author: "Ian Buchanan",
      date,
      source: transcript ? "voice-transcript" : (fileBuf ? "pdf" : "text"),
      tags
    };

    // Prepare Git objects
    const owner = process.env.GH_REPO_OWNER!;
    const repo = process.env.GH_REPO_NAME!;
    const base = process.env.GH_DEFAULT_BRANCH || "main";
    const token = process.env.GH_REPO_TOKEN!;
    const octo = new Octokit({ auth: token });

    // Get base ref
    const baseRef = await octo.rest.git.getRef({ owner, repo, ref: `heads/${base}` });
    const baseSha = baseRef.data.object.sha;
    const branch = `submit/${id}`;

    // Create branch
    await octo.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseSha });

    // Blobs
    const blobs: { path: string; sha: string; mode: "100644"; type: "blob" }[] = [];

    if (fileBuf) {
      const fileSha = (await octo.rest.git.createBlob({
        owner, repo, content: fileBuf.toString("base64"), encoding: "base64"
      })).data.sha;
      const ext = "." + (fileName.split(".").pop() || "pdf").toLowerCase();
      const fname = `${id}${ext}`;
      entry.file = `/files/${fname}`;
      blobs.push({ path: `files/${fname}`, sha: fileSha, mode: "100644", type: "blob" });
    }

    const qaSha = (await octo.rest.git.createBlob({
      owner, repo, content: Buffer.from(JSON.stringify(entry, null, 2)).toString("base64"),
      encoding: "base64"
    })).data.sha;
    blobs.push({ path: `qa/${id}.json`, sha: qaSha, mode: "100644", type: "blob" });

    // Tree
    const tree = (await octo.rest.git.createTree({
      owner, repo, base_tree: baseSha, tree: blobs
    })).data;

    // Commit
    const commit = (await octo.rest.git.createCommit({
      owner, repo, message: `chore(qa): ${question} (${date})`, tree: tree.sha, parents: [baseSha]
    })).data;

    await octo.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.sha, force: true });

    // PR
    const pr = (await octo.rest.pulls.create({
      owner, repo, head: branch, base, title: `chore(qa): ${question}`,
      body: `Auto-submitted from Trainer Form.\n\nTags: ${tags.join(", ") || "—"}`
    })).data;

    return json(res, { ok: true, prUrl: pr.html_url, id });
  } catch (e: any) {
    return json(res, { error: e?.message || "Server error" }, 500);
  }
}
