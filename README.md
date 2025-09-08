# Ian Buchanan Vault

Resources related to Ian Buchanan's works.

## Guides
- [ORCID Verification Guide](docs/ORCID_Verification_Guide.md)
- [Wikipedia Update Guide](docs/Wikipedia_Update_Guide.md)

## Cartography API

The Cartography page uses a backend service to compile and render concept graphs. The frontend reads the origin from the `VITE_CARTO_API_BASE` environment variable at build time. For production deployments the variable should point to the Render host that exposes the `/api` routes, e.g.

```
VITE_CARTO_API_BASE=https://<your-render>.onrender.com
VITE_DEFAULT_SITE_ID=buchanan-vault
```

Update these values in the Vercel project dashboard when the backend origin changes.
