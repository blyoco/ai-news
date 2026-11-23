// AI-nieuws: haalt het AI-nieuws van tientallen sites op (RSS), tagt alles en toont het op http://localhost:3300
// Starten: node server.mjs   (of dubbelklik start.bat). Geen installatie nodig, alleen Node.js.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 3333, ROOT = import.meta.dirname, CACHE_MIN = 15;
const gn = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:7d")}&hl=en-US&gl=US&ceid=US:en`;
const bn = (q) => `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setmkt=en-US&setlang=en&qft=sortbydate%3d%221%22`;
const bnl = (q) => `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setmkt=nl-NL`;
const gnl = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:7d")}&hl=nl&gl=NL&ceid=NL:nl`;

// filter: true = algemene site, alleen berichten die over AI gaan houden
const FEEDS = [
  ["TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"],
  ["The Verge AI", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"],
  ["Wired AI", "https://www.wired.com/feed/tag/ai/latest/rss"],
  ["MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed"],
  ["Ars Technica AI", "https://arstechnica.com/ai/feed/"],
  ["The Decoder", "https://the-decoder.com/feed/"],
  ["AI News", "https://www.artificialintelligence-news.com/feed/"],
  ["MarkTechPost", "https://www.marktechpost.com/feed/"],
  ["Unite.AI", "https://www.unite.ai/feed/"],
  ["KDnuggets", "https://www.kdnuggets.com/feed"],
  ["OpenAI", "https://openai.com/news/rss.xml"],
  ["Google AI", "https://blog.google/technology/ai/rss/"],
  ["Google DeepMind", "https://deepmind.google/blog/rss.xml"],
  ["Hugging Face", "https://huggingface.co/blog/feed.xml"],
  ["AWS Machine Learning", "https://aws.amazon.com/blogs/machine-learning/feed/"],
  ["NVIDIA", "https://blogs.nvidia.com/feed/", true],
  ["GitHub Blog", "https://github.blog/feed/", true],
  ["Simon Willison", "https://simonwillison.net/atom/everything/", true],
  ["Hacker News", "https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT+OR+Claude&points=40"],
  ["CG Channel", "https://www.cgchannel.com/feed/", true],
  ["Cartoon Brew", "https://www.cartoonbrew.com/feed", true],
  ["No Film School", "https://nofilmschool.com/rss.xml", true],
  ["Tweakers", "https://tweakers.net/feeds/nieuws.xml", true],
  ["arXiv cs.AI", "https://rss.arxiv.org/rss/cs.AI", false, 25],
  // Bing Nieuws: zelfde onderwerpen, maar met plaatjes en directe links
  ["Bing", bn("Runway AI video")],
  ["Bing", bn("Kling AI")],
  ["Bing", bn("Pika AI video")],
  ["Bing", bn("Luma AI Dream Machine")],
  ["Bing", bn("Sora OpenAI video")],
  ["Bing", bn("Google Veo")],
  ["Bing", bn("AI animation")],
  ["Bing", bn("AI video generator")],
  ["Bing", bn("Seedance OR Hailuo AI video")],
  ["Bing", bn("Higgsfield AI")],
  ["Bing", bn("Midjourney")],
  ["Bing", bn("Flux AI image")],
  ["Bing", bn("Stable Diffusion")],
  ["Bing", bn("Adobe Firefly AI")],
  ["Bing", bn("AI image generator")],
  ["Bing", bn("Suno AI")],
  ["Bing", bn("Udio AI music")],
  ["Bing", bn("ElevenLabs")],
  ["Bing", bn("AI music")],
  ["Bing", bn("Claude Code")],
  ["Bing", bn("Cursor AI")],
  ["Bing", bn("GitHub Copilot")],
  ["Bing", bn("OpenAI Codex")],
  ["Bing", bn("AI coding")],
  ["Bing", bn("Anthropic Claude")],
  ["Bing", bn("OpenAI ChatGPT")],
  ["Bing", bn("Google Gemini")],
  ["Bing", bn("Meta Llama AI")],
  ["Bing", bn("DeepSeek")],
  ["Bing", bn("Mistral AI")],
  ["Bing", bn("xAI Grok")],
  ["Bing", bn("AI agents")],
  ["Bing", bn("AI startup funding")],
  ["Bing", bn("Nvidia AI")],
  ["Bing", bn("AI regulation")],
  ["Bing", bn("AI robots humanoid")],
  ["Bing", bn("artificial intelligence")],
  ["Bing", bn("Runway Gen-4 OR Runway Aleph")],
  ["Bing", bn("AI short film")],
  ["Bing", bn("AI VFX film")],
  ["Bing", bn("AI 3D model generator")],
  ["Bing", bn("text to video AI")],
  ["Bing", bn("AI avatar video HeyGen OR Synthesia")],
  ["Bing", bn("Krea AI OR Ideogram")],
  ["Bing", bn("Nano Banana Google image")],
  ["Bing", bn("ComfyUI")],
  ["Bing", bn("AI voice clone")],
  ["Bing", bn("AI music generator")],
  ["Bing", bn("vibe coding")],
  ["Bing", bn("Lovable OR Replit AI")],
  ["Bing", bn("Windsurf AI coding")],
  ["Bing", bn("AI developer tools")],
  ["Bing", bn("ChatGPT update")],
  ["Bing", bn("Claude Anthropic new model")],
  ["Bing", bn("Gemini update")],
  ["Bing", bn("OpenAI GPT")],
  ["Bing", bn("AI model release")],
  ["Bing", bn("open source AI model")],
  ["Bing", bn("Hugging Face")],
  ["Bing", bn("AI chips")],
  ["Bing", bn("AI data center")],
  ["Bing", bn("AI lawsuit copyright")],
  ["Bing", bn("EU AI Act")],
  ["Bing", bn("AI safety")],
  ["Bing", bn("AI agents enterprise")],
  ["Bing", bn("AI browser")],
  ["Bing", bn("AI research breakthrough")],
  ["Bing", bn("generative AI")],
  // YouTube: AI-makers en de AI-bedrijven zelf
  ["YT Theoretically Media", "https://www.youtube.com/feeds/videos.xml?channel_id=UC9Ryt3XOGYBoAJVsBHNGDzA"],
  ["YT Curious Refuge", "https://www.youtube.com/feeds/videos.xml?channel_id=UClnFtyUEaxQOCd1s5NKYGFA"],
  ["YT MattVidPro", "https://www.youtube.com/feeds/videos.xml?channel_id=UC5Wz4fFacYuON6IKbhSa7Zw"],
  ["YT Olivio Sarikas", "https://www.youtube.com/feeds/videos.xml?channel_id=UCCKx8mAHiFus-XYQLy_WnaA"],
  ["YT Nerdy Rodent", "https://www.youtube.com/feeds/videos.xml?channel_id=UC4-5v-f-xKnbi1yaAuRSi_w"],
  ["YT Sebastian Kamph", "https://www.youtube.com/feeds/videos.xml?channel_id=UCvKqTb-65iAmXK59sFNKINQ"],
  ["YT Prompt Muse", "https://www.youtube.com/feeds/videos.xml?channel_id=UCP2RXiW0zYz7N2CnR9ANRCQ"],
  ["YT Matt Wolfe", "https://www.youtube.com/feeds/videos.xml?channel_id=UChpleBmo18P08aKCIgti38g"],
  ["YT AI Explained", "https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw"],
  ["YT Two Minute Papers", "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg", true],
  ["YT Wes Roth", "https://www.youtube.com/feeds/videos.xml?channel_id=UCqcbQf6yw5KzRoDDcZ_wBSw"],
  ["YT Matthew Berman", "https://www.youtube.com/feeds/videos.xml?channel_id=UCawZsQWqfGSbCI5yjkdVkTA"],
  ["YT bycloud", "https://www.youtube.com/feeds/videos.xml?channel_id=UCgfe2ooZD3VJPB6aJAnuQng"],
  ["YT All About AI", "https://www.youtube.com/feeds/videos.xml?channel_id=UCR9j1jqqB5Rse69wjUnbYwA"],
  ["YT The AI Advantage", "https://www.youtube.com/feeds/videos.xml?channel_id=UCHhYXsLBEVVnbvsq57n1MTQ"],
  ["YT AICodeKing", "https://www.youtube.com/feeds/videos.xml?channel_id=UC0m81bQuthaQZmFbXEY9QSw"],
  ["YT Cole Medin", "https://www.youtube.com/feeds/videos.xml?channel_id=UCMwVTLZIRRUyyVrkjDpn4pA"],
  ["YT IndyDevDan", "https://www.youtube.com/feeds/videos.xml?channel_id=UC_x36zCEGilGpB1m-V4gmjg"],
  ["YT Fireship", "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA", true],
  ["YT WorldofAI", "https://www.youtube.com/feeds/videos.xml?channel_id=UC2WmuBuFq6gL08QYG-JjXKw"],
  ["YT Runway", "https://www.youtube.com/feeds/videos.xml?channel_id=UCUBqu_z5uP0AZhYtuyFZB3g"],
  ["YT Luma AI", "https://www.youtube.com/feeds/videos.xml?channel_id=UC45T0I4p7A3dI0XvhivafZQ"],
  ["YT Google DeepMind", "https://www.youtube.com/feeds/videos.xml?channel_id=UCP7jMXSY2xbc3KCAE0MHQ-A"],
  ["YT OpenAI", "https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A"],
  ["YT Anthropic", "https://www.youtube.com/feeds/videos.xml?channel_id=UCrDwWp7EBBv4NwvScIpBDOA"],
  ["YT Kling AI", "https://www.youtube.com/feeds/videos.xml?channel_id=UCScFj8erJ91w8-jzNrNzrDA"],
  ["YT Higgsfield AI", "https://www.youtube.com/feeds/videos.xml?channel_id=UCh13OyDSm-Kb8ij3yZArtFg"],
  ["YT Pika", "https://www.youtube.com/feeds/videos.xml?channel_id=UCv9NoFm48d6-4aCk4Eszhog"],
  ["YT Tao Prompts", "https://www.youtube.com/feeds/videos.xml?channel_id=UCc1qMq2UBJD9cSKbeBwGoZQ"],
  ["YT TheAIGRID", "https://www.youtube.com/feeds/videos.xml?channel_id=UCbY9xX3_jW5c2fjlZVBI4cg"],
  // nieuwsbrieven
  ["NL The Rundown AI", "https://www.therundown.ai/feed"],
  ["NL Ben's Bites", "https://www.bensbites.com/feed"],
  ["NL Latent Space", "https://latent.space/feed"],
  ["NL Import AI", "https://importai.substack.com/feed"],
  ["NL One Useful Thing", "https://www.oneusefulthing.org/feed"],
  ["NL Last Week in AI", "https://lastweekin.ai/feed"],
  ["NL Interconnects", "https://www.interconnects.ai/feed"],
  ["NL Understanding AI", "https://www.understandingai.org/feed"],
  ["NL TLDR AI", "https://tldr.tech/api/rss/ai"],
  ["NL The Neuron", "https://www.theneurondaily.com/feed"],
  // social: Bluesky, Product Hunt
  ["BS Simon Willison", "https://bsky.app/profile/simonwillison.net/rss", true],
  ["BS Ethan Mollick", "https://bsky.app/profile/emollick.bsky.social/rss", true],
  ["BS Nathan Lambert", "https://bsky.app/profile/natolambert.bsky.social/rss", true],
  ["BS Gary Marcus", "https://bsky.app/profile/garymarcus.bsky.social/rss", true],
  ["BS Hugging Face", "https://bsky.app/profile/huggingface.bsky.social/rss", true],
  ["BS Jeremy Howard", "https://bsky.app/profile/howard.fm/rss", true],
  ["Product Hunt", "https://www.producthunt.com/feed?category=artificial-intelligence"],
  // video, animatie, VFX en beeld (alleen AI-berichten)
  ["fxguide", "https://www.fxguide.com/feed/", true],
  ["befores & afters", "https://beforesandafters.com/feed/", true],
  ["ProVideo Coalition", "https://www.provideocoalition.com/feed/", true],
  ["CineD", "https://www.cined.com/feed/", true],
  ["PetaPixel", "https://petapixel.com/feed/", true],
  ["Creative Bloq", "https://www.creativebloq.com/feeds/all", true],
  ["Digital Trends", "https://www.digitaltrends.com/feed/", true],
  ["Bing", bn("Runway Gen AI video")],
  ["Bing", bn("Kling video model")],
  ["Bing", bn("Veo 3 video")],
  ["Bing", bn("Sora 2")],
  ["Bing", bn("AI music video")],
  ["Bing", bn("AI animated film")],
  ["Bing", bn("AI generated commercial")],
  ["Bing", bn("Wan video model")],
  ["Bing", bn("LTX Studio")],
  ["Bing", bn("Hedra AI")],
  ["Bing", bn("Moonvalley AI")],
  ["Bing", bn("Luma Ray video")],
  ["Bing", bn("Pika AI")],
  ["Bing", bn("Minimax Hailuo video")],
  ["Bing", bn("AI VFX")],
  ["Bing", bn("AI filmmaker")],
  ["Bing", bn("Midjourney video")],
  ["Bing", bn("Adobe Firefly video")],
  ["Bing", bn("text to video model")],
  ["Bing", bn("AI animation studio")],
  ["Bing", bn("AI cartoon")],
  ["Bing", bn("Hollywood AI")],
  ["Bing", bn("AI film festival")],
  ["Bing", bn("AI avatar")],
  ["Bing", bn("AI lip sync")],
  ["Bing", bn("AI 3D animation")],
  ["Bing", bn("Gaussian splatting")],
  ["Bing", bn("AI motion graphics")],
  ["Bing", bn("Higgsfield")],
  ["Bing", bn("Seedance ByteDance")],
  ["Bing", bn("Freepik AI")],
  ["Bing", bn("Krea video")],
  ["Bing", bn("Topaz video AI")],
  ["Bing", bn("AI video editing")],
  ["Bing", bn("CapCut AI")],
  // muziek & audio: AI-muziekbedrijven en muziektechniek op YouTube
  ["YT Suno", "https://www.youtube.com/feeds/videos.xml?channel_id=UCRYjCM9IQm5cPCws3fczZzA"],
  ["YT Suno AI", "https://www.youtube.com/feeds/videos.xml?channel_id=UCVEvexo4PqDGq75dgL6MhRQ"],
  ["YT Udio", "https://www.youtube.com/feeds/videos.xml?channel_id=UC4GZf6ElzDsCWiDN7ql9CZw"],
  ["YT ElevenLabs", "https://www.youtube.com/feeds/videos.xml?channel_id=UC-ew9TfeD887qUSiWWAAj1w"],
  ["YT Stability AI", "https://www.youtube.com/feeds/videos.xml?channel_id=UCrhOqMww3ItTHOKxtYM56cg"],
  ["YT Andrew Huang", "https://www.youtube.com/feeds/videos.xml?channel_id=UCdcemy56JtVTrsFIOoqvV8g", true],
  ["YT Venus Theory", "https://www.youtube.com/feeds/videos.xml?channel_id=UCzsd4-oyHhNbAXfceOQ5HTw", true],
  ["YT LANDR", "https://www.youtube.com/feeds/videos.xml?channel_id=UCoYkWZ08y9HVu0KDpdxF8MA", true],
  ["YT iZotope", "https://www.youtube.com/feeds/videos.xml?channel_id=UCFYLFu6j4hxl5vEnpl7hw3w", true],
  ["YT Native Instruments", "https://www.youtube.com/feeds/videos.xml?channel_id=UCwjiBFz7LuxYvmIRw5kChFA", true],
  ["YT Splice", "https://www.youtube.com/feeds/videos.xml?channel_id=UCb8xLPa5RP8TnCsU7E5ASKQ", true],
  ["YT MusicTech", "https://www.youtube.com/feeds/videos.xml?channel_id=UCJuecBTF7-qEKzvNoe-9jDw", true],
  ["YT DJ TechTools", "https://www.youtube.com/feeds/videos.xml?channel_id=UCkZQQVgNUToyz5bocyA-cog", true],
  ["YT MusicRadar", "https://www.youtube.com/feeds/videos.xml?channel_id=UCxV9Giax10UB9CoMbRU0ZSw", true],
  // muziek & audio: vakbladen en muziektechniek (alleen AI-berichten)
  ["Music Business Worldwide", "https://www.musicbusinessworldwide.com/feed/", true],
  ["Digital Music News", "https://www.digitalmusicnews.com/feed/", true],
  ["MusicRadar", "https://www.musicradar.com/rss", true],
  ["CDM", "https://cdm.link/feed/", true],
  ["Attack Magazine", "https://www.attackmagazine.com/feed/", true],
  ["Music Ally", "https://musically.com/feed/", true],
  ["MusicTech", "https://musictech.com/feed/", true],
  ["Billboard", "https://www.billboard.com/feed/", true],
  ["Rekkerd", "https://rekkerd.org/feed/", true],
  ["Synthtopia", "https://www.synthtopia.com/feed/", true],
  ["Mixmag", "https://mixmag.net/rss.xml", true],
  ["DJ Mag", "https://djmag.com/feed", true],
  ["DJ TechTools", "https://djtechtools.com/feed/", true],
  ["Sound On Sound", "https://www.soundonsound.com/rss.xml", true],
  ["Gearnews", "https://www.gearnews.com/feed/", true],
  ["Bing", bn("Suno AI music")],
  ["Bing", bn("Udio AI")],
  ["Bing", bn("ElevenLabs music")],
  ["Bing", bn("ElevenLabs voice")],
  ["Bing", bn("Stable Audio")],
  ["Bing", bn("Google Lyria")],
  ["Bing", bn("AI music generator")],
  ["Bing", bn("AI song")],
  ["Bing", bn("AI music copyright")],
  ["Bing", bn("AI music lawsuit")],
  ["Bing", bn("AI music label deal")],
  ["Bing", bn("Spotify AI")],
  ["Bing", bn("AI artist streaming")],
  ["Bing", bn("AI mastering")],
  ["Bing", bn("AI mixing plugin")],
  ["Bing", bn("AI stem separation")],
  ["Bing", bn("AI DJ")],
  ["Bing", bn("AI beat maker")],
  ["Bing", bn("AI vocals")],
  ["Bing", bn("AI singing voice")],
  ["Bing", bn("AI voice cloning")],
  ["Bing", bn("text to speech model")],
  ["Bing", bn("AI sound effects")],
  ["Bing", bn("AI audio plugin")],
  ["Bing", bn("Ableton AI")],
  ["Bing", bn("FL Studio AI")],
  ["Bing", bn("Splice AI")],
  ["Bing", bn("LANDR AI")],
  ["Bing", bn("iZotope AI")],
  ["Bing", bn("Mureka AI")],
  ["Bing", bn("Riffusion")],
  ["Bing", bn("AI music producer")],
  ["Bing", bn("AI podcast")],
  ["Bing NL", bnl("kunstmatige intelligentie")],
  ["Bing NL", bnl("AI")],
];

// tags: naam -> trefwoorden (in titel + tekst)
const TAGS = [
  ["Video & Animation", /\b(runway|kling|pika|sora|veo|luma|dream machine|hailuo|minimax|seedance|higgsfield|wan ?2|ltx|animat\w*|text[- ]to[- ]video|image[- ]to[- ]video|video (generat|model|ai)|ai video|aivideo|vfx|filmmak\w*|motion capture|cgi|3d)\b/i],
  ["Images", /\b(midjourney|stable diffusion|sdxl|flux|dall-?e|imagen|firefly|ideogram|comfyui|krea|recraft|nano banana|image (generat|model|edit)\w*|text[- ]to[- ]image|lora|photoshop)\b/i],
  ["Music & Audio", /\b(suno|udio|elevenlabs|lyria|musicgen|stable audio|riffusion|mureka|music\w*|songs?|singers?|vocals?|audio|voices?|voice clon\w*|speech|text[- ]to[- ]speech|tts|podcasts?|sounds?|mastering|mixing|stems?|daw|ableton|fl studio|logic pro|plugins?|vst|synth\w*|music producers?|djs?|beat ?makers?|sample packs?|spotify|royalt\w*|record labels?|izotope|landr|splice|native instruments)\b/i],
  ["Code", /\b(cod(e|ing|er)s?|developers?|programm\w*|cursor|copilot|github|claude code|codex|windsurf|replit|lovable|bolt|vibe coding|ide|sdk|api|open[- ]source|python|javascript)\b/i],
  ["Models & Chatbots", /\b(gpt[- ]?\d\w*|chatgpt|claude|gemini|llama|mistral|deepseek|qwen|grok|llms?|language models?|chatbots?|reasoning model|frontier model|opus|sonnet)\b/i],
  ["Agents & Automation", /\b(agents?|agentic|automat\w*|workflows?|mcp|computer use|assistants?)\b/i],
  ["Business & Funding", /\b(funding|raises?|raised|acqui\w+|ipo|valuation|billion|million|invest\w*|startup|revenue|layoffs?|deal|partnership)\b/i],
  ["Research", /\b(paper|research\w*|arxiv|benchmark|study|scientists?|breakthrough|dataset)\b/i],
  ["Hardware & Chips", /\b(nvidia|gpus?|chips?|tpu|data ?cent(er|re)s?|semiconductor|amd|intel|blackwell)\b/i],
  ["Policy & Safety", /\b(regulat\w*|laws?|ai act|safety|copyright|lawsuit|sued|court|policy|ethic\w*|privacy|deepfakes?|government|ban)\b/i],
  ["Robotics", /\b(robot\w*|humanoid|self-driving|autonomous vehicles?|waymo|tesla)\b/i],
  ["Tutorials & Tips", /\b(how to|guide|tutorial|tips|explained|step[- ]by[- ]step|beginner)\b/i],
  ["Dutch", /\b(kunstmatige|het|een|de nieuwe|wordt|voor)\b/],
];
const AI_RE = /\b(ai|a\.i\.|artificial intelligence|kunstmatige intelligentie|machine learning|neural|llms?|gpt\w*|chatgpt|claude|gemini|openai|anthropic|deepmind|generative|genai|copilot|midjourney|runway|stable diffusion|diffusion model|agents?|agentic)\b/i;

const ent = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
const decode = (s = "") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&(\w+);/g, (m, n) => ent[n] ?? m);
const strip = (s = "") => decode(decode(s)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tag = (x, n) => x.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"))?.[1];
const attr = (x, n, a) => x.match(new RegExp(`<${n}\\b[^>]*\\b${a}=["']([^"']+)["']`, "i"))?.[1];

function parse(xml, source, filter, max = 60) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const out = [];
  for (const b of blocks.slice(0, max)) {
    let title = strip(tag(b, "title"));
    let link = decode(tag(b, "link") ?? "").trim();
    if (!link || link.startsWith("<")) link = decode(attr(b, "link", "href") ?? "");
    const raw = tag(b, "content:encoded") ?? tag(b, "description") ?? tag(b, "summary") ?? tag(b, "content") ?? "";
    let text = strip(raw).slice(0, 280);
    const date = new Date(strip(tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date") ?? ""));
    let img = decode(attr(b, "media:content", "url") ?? attr(b, "media:thumbnail", "url") ?? (/<enclosure[^>]+image/i.test(b) ? attr(b, "enclosure", "url") : null)
      ?? decode(raw).match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? "");
    let src = source;
    if (source.startsWith("Bing")) {
      src = strip(tag(b, "News:Source")) || src;
      try { link = new URL(link).searchParams.get("url") || link; } catch {}
      const bi = decode(tag(b, "News:Image") ?? ""); if (bi) img = bi.replace(/^http:/, "https:") + "&w=640&h=360&c=14";
    }
    if (source.startsWith("Google Nieuws")) {           // "Titel - Bron"
      const m = title.match(/^(.*) - ([^-]+)$/); if (m) { title = m[1]; src = m[2].trim(); }
      text = "";
    }
    if (source.startsWith("YT ")) { src = source.slice(3) + " · YouTube"; const vid = tag(b, "yt:videoId"); img = vid ? `https://i.ytimg.com/vi/${vid.trim()}/hqdefault.jpg` : img; text = strip(tag(b, "media:description") ?? "").slice(0, 280); }
    if (source.startsWith("BS ")) { src = source.slice(3) + " · Bluesky"; if (!title) title = text.length > 140 ? text.slice(0, 137).replace(/\s+\S*$/, "") + "…" : text; }
    if (source.startsWith("NL ")) src = source.slice(3);
    if (source.startsWith("r/")) text = text.replace(/submitted by .*$/i, "").trim();
    if (!title || !link) continue;
    if (filter && !AI_RE.test(title + " " + text)) continue;
    const hay = title + " " + text;
    const tags = TAGS.filter(([n, re]) => n === "Dutch" ? source.endsWith("NL") || source === "Bing NL" || source === "Tweakers" : re.test(hay)).map(([n]) => n);
    const kind = source.startsWith("YT ") ? "YouTube" : source.startsWith("BS ") || source === "Product Hunt" || source === "Hacker News" ? "Social" : source.startsWith("NL ") ? "Newsletters" : null;
    if (!tags.length || (tags.length === 1 && tags[0] === "Dutch")) tags.push("Other");
    if (kind) tags.unshift(kind);
    out.push({ title, link, text, img: img.startsWith("http") ? img : "", source: src, feed: source, date: isNaN(date) ? null : date.toISOString(), tags });
  }
  return out;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (ai-news-reader/1.0)", Accept: "application/rss+xml, application/xml, text/xml, */*" }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.text();
}

const CACHE_FILE = path.join(ROOT, "cache.json");
let cache = null, cacheAt = 0, busy = null;
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); cacheAt = Date.parse(cache.updated); } catch {}
async function load() {
  const t0 = Date.now(), status = [];
  // per site na elkaar (anders krijg je "te veel verzoeken"), verschillende sites tegelijk
  const one = async ([name, url, filter, max]) => {
    for (let tries = 0; ; tries++) {
      try { const items = parse(await get(url), name, filter, max); status.push({ name, url, ok: true, n: items.length }); return items; }
      catch (e) {
        if (tries < 2 && /429|abort|timeout/i.test(String(e.message))) { await wait(3000 * (tries + 1)); continue; }
        status.push({ name, url, ok: false, error: String(e.message || e) }); return [];
      }
    }
  };
  const hosts = Map.groupBy(FEEDS, (f) => new URL(f[1]).host);
  const res = (await Promise.all([...hosts.values()].map(async (list) => {
    const out = []; for (const f of list) { out.push(await one(f)); if (list.length > 1) await wait(700); } return out.flat();
  })));
  const seen = new Map();
  for (const it of res.flat()) {
    const k = it.title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 70), old = seen.get(k);
    if (!old) seen.set(k, it);
    else { if (!old.img && it.img) old.img = it.img; if (!old.text && it.text) old.text = it.text; if (old.link.includes("news.google.") && !it.link.includes("news.google.")) old.link = it.link; }
  }
  const items = [...seen.values()];
  for (const it of items) if (!it.img && imgs[it.link]) it.img = imgs[it.link];
  items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  if (items.length < 50 && cache) return cache;   // mislukte ronde: oude houden
  cache = { updated: new Date().toISOString(), ms: Date.now() - t0, count: items.length, items, status }; cacheAt = Date.now();
  console.log(`${items.length} berichten uit ${status.filter((s) => s.ok).length}/${FEEDS.length} bronnen (${cache.ms} ms)`);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  return cache;
}
const IMG_FILE = path.join(ROOT, "images.json");
let imgs = {}; try { imgs = JSON.parse(fs.readFileSync(IMG_FILE, "utf8")); } catch {}
async function fillImages() {
  const todo = cache.items.filter((i) => !i.img && !(i.link in imgs)).slice(0, 400);
  let k = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (k < todo.length) {
      const it = todo[k++];
      try {
        const r = await fetch(it.link, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36" }, signal: AbortSignal.timeout(6000) });
        const html = (await r.text()).slice(0, 300000);
        const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::src)?["'][^>]*content=["']([^"']+)/i) ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)/i);
        imgs[it.link] = m ? new URL(decode(m[1]), it.link).href : "";
      } catch { imgs[it.link] = ""; }
      if (imgs[it.link]) it.img = imgs[it.link];
    }
  }));
  fs.writeFileSync(IMG_FILE, JSON.stringify(imgs)); fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  console.log(`plaatjes gezocht voor ${todo.length} berichten`);
}
const refresh = () => (busy ??= load().then(fillImages).catch((e) => console.error(e)).finally(() => (busy = null)));
// direct antwoorden met wat er al is; is het ouder dan 15 min, dan op de achtergrond verversen
const news = (force) => { if (force || Date.now() - cacheAt > CACHE_MIN * 60e3) refresh(); return cache ?? busy; };

const page = () => {
  const first = cache ? JSON.stringify({ ...cache, items: cache.items.slice(0, 12), status: [], partial: true }).replace(/</g, "\\u003c") : "null";
  return fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace("/*FIRST*/null", first);
};

// node server.mjs --build  ->  statische site in dist/ (voor Cloudflare Pages)
if (process.argv.includes("--build")) {
  await refresh();
  const out = path.join(ROOT, "dist"); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "news.json"), JSON.stringify(cache));
  fs.writeFileSync(path.join(out, "index.html"), page());
  fs.writeFileSync(path.join(out, "_headers"), "/news.json\n  Cache-Control: public, max-age=300\n/\n  Cache-Control: public, max-age=300\n");
  console.log("dist/ klaar:", cache.count, "berichten"); process.exit(0);
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/news" || u.pathname === "/news.json") {
    if (u.searchParams.has("wait") && busy) await busy;
    const d = await news(u.searchParams.has("refresh"));
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }); return res.end(JSON.stringify({ ...d, busy: !!busy }));
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(page());
}).listen(PORT, () => { console.log(`AI News draait op http://localhost:${PORT}`); news(); setInterval(refresh, CACHE_MIN * 60e3); });
