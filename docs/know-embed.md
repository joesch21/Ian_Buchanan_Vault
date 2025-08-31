# Know Embed (Buchanan Vault)

## Frontend (Vercel)
- Files: `public/knowbot/knowbot.css`, `public/knowbot/knowbot.min.js`
- Env: `VITE_KNOW_API_BASE`, `VITE_KNOW_SITE_ID`
- Layout snippet:
  ```html
  <link rel="stylesheet" href="/knowbot/knowbot.css" />
  <script defer src="/knowbot/knowbot.min.js"></script>
  <script>
    window.KnowBot.init({
      siteId: (window?.importMeta?.env?.VITE_KNOW_SITE_ID) || "buchanan-vault",
      api: (window?.importMeta?.env?.VITE_KNOW_API_BASE) || "https://<render-app>.onrender.com/api/know/v1"
    });
  </script>
  ```

API (Render)
•Path: /api/know/v1
•Health: /api/healthz
•Endpoints: POST /query, GET /tools, POST /ingest (stub)
•CORS allowlist your Vercel domains

Smoke

```
curl -s https://<render-app>.onrender.com/api/healthz
curl -sX POST https://<render-app>.onrender.com/api/know/v1/query -H "content-type: application/json" -d "{\"siteId\":\"buchanan-vault\",\"msg\":\"open bibliography for assemblage 2000–2010\"}"
```
