# Shree Vaibhav Mahal — demo pitch site

A five-route static site with one serverless API route, built as a WhatsApp-able demo for a
marriage hall that has no website. Everything visible is real-sounding copy for a specific
(fictional) business — no lorem ipsum.

```
/                 index.html      scroll-scrubbed video hero, about, package preview, reviews
/packages         packages.html   Silver / Gold / Platinum, add-on rates, FAQ
/gallery          gallery.html    6 tiles + video tour
/reviews          reviews.html    testimonials + trust stats
/visit            visit.html      address, map, hours, enquiry form
/api/enquiry      api/enquiry.js  POST endpoint for the form (Node serverless)
404.html                          shown for any unknown path
assets/css/site.css               one stylesheet for every page
assets/js/site.js                 nav, reveals, video scrub, form
assets/video/                     hero.mp4 (1.9 MB desktop) · hero-sm.mp4 (120 KB mobile) · poster
```

---

## 1. Before you send it to anyone

Open `assets/js/site.js` and fill in the block at the top:

```js
const DESIGNER = {
  name : "Beni · PdktDev",
  phone: "+91 XXXXX XXXXX",   // ← shown in the footer
  tel  : "+91XXXXXXXXXX",     // ← digits only, powers tel: and wa.me links
  email: "beniel.herlin@gmail.com"
};
```

Until `tel` has real digits, the footer's "Talk to the designer" button falls back to email.

## 2. Preview it locally

```bash
npx serve .          # http://localhost:3000 — clean URLs work out of the box
# or, to test /api/enquiry too:
npm i -g vercel && vercel dev
```

Do **not** open `index.html` by double-clicking it. The links point at `/packages`, `/visit`
etc., which only resolve over HTTP, not `file://`.

## 3. Deploy to Vercel

### Option A — CLI (fastest, ~2 minutes)

```bash
npm i -g vercel
cd mahal-demo
vercel login
vercel            # preview deployment, answer the prompts with the defaults
vercel --prod     # promotes it to the permanent *.vercel.app URL
```

The first `vercel` run asks: *Set up and deploy?* → **Y**, *Which scope?* → your account,
*Link to existing project?* → **N**, *Project name?* → `mahal-demo`, *Directory?* → `./`,
*Modify settings?* → **N**. Framework detection should say **Other** — that's correct, this
is a static site with a functions folder.

### Option B — GitHub (best if you'll iterate)

```bash
git init && git add . && git commit -m "Demo site for Shree Vaibhav Mahal"
gh repo create mahal-demo --private --source=. --push
```

Then vercel.com → **Add New… → Project** → import the repo → **Deploy**. Every push to
`main` redeploys automatically, and each pull request gets its own preview URL.

### Option C — drag and drop

vercel.com/new → drop the `mahal-demo` folder onto the upload area. Fine for a one-off,
but you lose the redeploy-on-push workflow.

### After deploying

- The URL will look like `https://mahal-demo.vercel.app` — that's the link you send on WhatsApp.
- **Custom domain:** Project → Settings → Domains → add `mahalmaharaj.in` (or a subdomain like
  `demo.pdktdev.in`, which is the cheaper way to show clients). Vercel prints the DNS records;
  add them at your registrar, and HTTPS is issued automatically within a few minutes.
- `vercel.json` already sets clean URLs, one-year caching on `/assets/*`, and `X-Robots-Tag:
  noindex`. Every page also carries a `noindex` meta tag — the site is an unofficial demo of a
  real business, so it should not turn up in search results. **Remove both when a client buys it.**

## 4. Where enquiries go

By default `/api/enquiry` validates the submission and logs it — Vercel → your project →
**Logs**, or `vercel logs <deployment-url>`. To get a real notification, set one environment
variable:

Project → Settings → Environment Variables → `ENQUIRY_WEBHOOK_URL` = a Slack / Discord /
Google Chat / Make.com incoming webhook URL. Redeploy once and every enquiry is pushed there
as `{ text, enquiry }`. No code change needed.

If the API is ever unreachable (or you host this somewhere static like GitHub Pages), the form
falls back to opening WhatsApp with the enquiry pre-filled — set `BUSINESS_WA` in
`assets/js/site.js` to the owner's number in international format without `+`.

The endpoint also has: a honeypot field, a 5-per-minute-per-IP throttle, length caps on every
field, and phone-digit validation.

## 5. Re-skinning it for the next client

1. Find-and-replace `Shree Vaibhav Mahal`, `+91 98765 43210` / `+919876543210`, the address,
   the Google Maps query string, and `shreevaibhavmahal` (Instagram).
2. Swap the three package cards and the add-on rates in `packages.html`.
3. Replace the three review cards — each is flagged `<!-- placeholder review -->`.
4. Colours live in five CSS variables at the top of `assets/css/site.css`
   (`--plum`, `--maroon`, `--gold`, `--ivory`, `--cream`). Change those five and the whole
   site re-skins; a gym or a salon needs nothing more than a new palette and font pair.

## 6. Photos and video

Gallery tiles have illustrated SVG fallbacks underneath the photo slots, so a missing or
broken image never shows as an empty box — any `<img>` that fails to load is removed and the
illustration stays. Drop real photos into the `src` attributes in `gallery.html` (roughly
1200×900, compressed) whenever the client sends them.

The hero video is generated artwork, not stock footage — 5 seconds, seamless loop, all
keyframes so scrubbing is smooth. On desktop with a mouse, page scroll drives
`video.currentTime`; on phones and with `prefers-reduced-motion` it becomes a quiet autoplay
loop of the 120 KB file. To use real hall footage instead, replace `assets/video/hero.mp4`
(keep it under ~3 MB, and re-encode with `-g 1` so seeking stays smooth):

```bash
ffmpeg -i your-clip.mp4 -t 6 -an -c:v libx264 -crf 24 -pix_fmt yuv420p -g 1 \
  -movflags +faststart assets/video/hero.mp4
ffmpeg -i assets/video/hero.mp4 -vf scale=720:-2 -an -c:v libx264 -crf 27 -pix_fmt yuv420p \
  -movflags +faststart assets/video/hero-sm.mp4
ffmpeg -i assets/video/hero.mp4 -frames:v 1 -q:v 6 assets/video/hero-poster.jpg
```

---

Built by PdktDev · demo only, not affiliated with any business named on these pages.
