# AI News

All the latest AI news from hundreds of sources, sorted by topic.

Live: https://ainews.rodneybalai.workers.dev

- Local: double-click `start.bat` (or `node server.mjs`) and open http://localhost:3333
- Build the static site: `node server.mjs --build` -> `dist/`
- Deploy by hand: `npx wrangler deploy`
- GitHub Actions (`.github/workflows/update.yml`) rebuilds and deploys every 15 minutes. It needs the repository secret `CLOUDFLARE_API_TOKEN` (Cloudflare token with the template "Edit Cloudflare Workers").
