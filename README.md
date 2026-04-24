# Dropship Pass

A self-contained dropshipping research hub. Open `index.html` and you're running.

## What it gives you

- **Live trending** — fetched on every page load from Reddit (r/dropship, r/ecommerce, r/Shopify, r/FulfillmentByAmazon, r/smallbusiness) and Hacker News commerce stories.
- **Winner catalog** — 12 curated products with margin, difficulty, target audience, channels, platforms, hooks, angles, and risks. Click any card for the full play.
- **Where to sell** — Shopify, Amazon, TikTok Shop, Etsy, eBay, Temu, Meta Shop, Walmart. Strengths, watch-outs, fees, how to start.
- **How to sell** — 6 step-by-step playbooks (validation sprint, organic-first, Meta, TikTok Shop affiliates, Google Shopping, email/SMS).
- **Audience profiles** — 8 profiles with where they live online, what they buy, why, and what hooks convert them.
- **Ad channels** — Meta, TikTok, Google, Pinterest, YouTube, Reddit. CPMs, starting points, metrics to watch.
- **Tools** — 12 free or free-tier tools for research, sourcing, fulfillment, creative, email.
- **Stay-out-of-trouble rules** — the fast ways to lose your ad accounts or get your store banned.

## How to use it

1. Double-click `index.html` to open in any browser.
2. Hit the **↻ Refresh** button in the header to re-pull live feeds.
3. It auto-refreshes every 20 minutes while the tab is open.

## Deploying it for free (always online)

Pick one — all free:

**Netlify Drop** (easiest, 1 minute):
1. Go to https://app.netlify.com/drop
2. Drag the `dropship-pass` folder onto the page
3. You get a public URL like `yourthing.netlify.app`

**GitHub Pages** (better for iterating):
1. Create a new GitHub repo, push this folder into it
2. Settings → Pages → deploy from `main` branch
3. URL will be `yourname.github.io/reponame`

**Cloudflare Pages / Vercel**: drag-drop flows similar to Netlify. Also free.

## What the "self-updating" actually means

- **Live feeds** (Reddit + Hacker News) are fetched client-side on every page open / refresh click. No server needed. No stale data — it's as fresh as when you open the tab.
- **Curated knowledge base** (`data.js`) holds the evergreen plays. Edit it to add your own winners; the UI re-renders from it automatically.
- **Rising trends panel** rotates through a baked-in list of emerging niches so the section always feels alive even when external APIs are slow.

## What it does NOT do — and why

- **No scraping of Meta Ads Library or Google Ads data** from this app. Both platforms prohibit unauthorized scraping in their Terms of Service, and doing it will get your ad accounts banned — the opposite of what you want. Instead, the Tools section links directly to the **free, official** Ads Library and TikTok Creative Center, which are the legitimate ways to see what competitors are running.
- **No private API keys baked in.** Everything is client-side and uses only public, CORS-friendly endpoints. You can ship it anywhere without secrets management.
- **No fake "50 years of data."** Modern dropshipping as a discipline is ~10 years old. The curated plays in `data.js` reflect what's consistently worked across that period; the live feeds cover what's happening now.

## Customizing

Everything lives in three files:

- `data.js` — products, platforms, playbooks, audiences, ads, tools, rules. Edit this first.
- `styles.css` — visual theme. Change the `:root` CSS variables at the top to rebrand.
- `app.js` — rendering + live feed logic. Add more feeds by following the `fetchReddit` / `fetchHN` pattern.

No build step, no npm, no dependencies. Just HTML, CSS, and vanilla JS.
