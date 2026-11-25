// De klok staat bij Cloudflare: elke 15 minuten vraagt deze Worker aan GitHub om de workflow "update news" te starten.
// GitHub haalt dan het nieuws op en zet de site live. Op je eigen computer hoeft niets te draaien.
// Nodig: Worker-secret GITHUB_TOKEN (fine-grained token, alleen deze repo, recht "Actions: Read and write").
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env) {
    if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN ontbreekt (Worker-secret)");
    const r = await fetch(`https://api.github.com/repos/${env.GH_REPO}/actions/workflows/update.yml/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "ai-news-updater (Cloudflare Worker cron)",
      },
      body: JSON.stringify({ ref: "main" }),
    });
    // een fout laat de cron-run in Cloudflare als mislukt zien, zodat je het in het dashboard terugvindt
    if (r.status !== 204) throw new Error(`GitHub gaf ${r.status}: ${(await r.text()).slice(0, 300)}`);
  },
};
