📜 Codex Work Order (CWO)

Title: Rollback Branch Deployment Flow
ID: CWO-ROLLBACK-DEPLOY-001
Owner: Ian Buchanan Vault Project
Date: 2025-08-30 (Sydney)

🎯 Objective

Provide a safe, repeatable process to roll back to a previous commit and deploy it via Vercel/Codex, without losing future commits.

🪜 Steps

1. **Identify commit**

   From GitHub (Deployments → commit history) or Vercel (deployment details), copy the commit hash (e.g., `b456cca`).

2. **Create rollback branch locally**

   ```bash
   git fetch origin
   git checkout -b rollback-biblio b456cca
   ```

   Replace `rollback-biblio` with a meaningful branch name.

3. **Push rollback branch to GitHub**

   ```bash
   git push origin rollback-biblio
   ```

4. **Choose deployment path**

   **Option A — Temporary rollback (non-destructive, safe)**

   - Go to Vercel Dashboard → Project Settings → Git.
   - Under Production Branch, select `rollback-biblio`.
   - Vercel will redeploy production from this branch.
   - Later you can switch back to `main` when ready.

   **Option B — Permanent rollback (destructive, overwrites main)**

   - Open a Pull Request:
     https://github.com/joesch21/Ian_Buchanan_Vault/pull/new/rollback-biblio
   - Merge `rollback-biblio` → `main`.
   - Vercel (which tracks `main` by default) will redeploy automatically.
   - ⚠️ Note: This discards commits after the rollback point.

🧪 Verification

- Run `git status` → ensure you’re on `rollback-biblio`.
- On GitHub, confirm branch exists and matches the target commit.
- In Vercel, confirm Production deployment points to the rollback commit.
- Test site URL: https://buchanan-vault-*.vercel.app → ensure it shows rolled-back features.

📝 Notes

- Safe mode: always prefer Option A (temporary rollback) if unsure.
- Force reset (`git reset --hard <commit> && git push origin main --force`) should only be used if you explicitly want to rewrite `main`.
- Document rollback reasons in commit/PR description.
- Clean up rollback branches after merging to avoid clutter.
