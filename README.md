# AI News

All the latest AI news from hundreds of sources, sorted by topic.

Live: https://ainews.rodneybalai.workers.dev

- Local: double-click `start.bat` (or `node server.mjs`) and open http://localhost:3333
- Build the static site: `node server.mjs --build` -> `dist/`
- Deploy by hand: `npx wrangler deploy`
- Every 15 minutes a Cloudflare cron trigger (`worker.js`) starts the GitHub Action (`.github/workflows/update.yml`), which rebuilds and deploys. Nothing has to run on your own computer.
  - The Worker needs the secret `GITHUB_TOKEN`: a fine-grained GitHub token for this repository only, with the permission "Actions: Read and write".
  - The Action needs the repository secret `CLOUDFLARE_API_TOKEN` (Cloudflare token with the template "Edit Cloudflare Workers").
  - GitHub's own schedule runs hourly as a backup only; on its own it skips runs for hours.
