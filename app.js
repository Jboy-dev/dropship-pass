// Dropship Pass — app logic
// Renders curated catalog, pulls live public signals on load and on refresh.

const DATA = window.DROPSHIP_DATA;

// ---------- helpers ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const el = (tag, props={}, ...children) => {
  const n = document.createElement(tag);
  Object.entries(props).forEach(([k,v])=>{
    if(k==="class") n.className = v;
    else if(k==="html") n.innerHTML = v;
    else if(k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v);
  });
  for(const c of children){
    if(c==null) continue;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
};
const fmtTime = (d)=> {
  const diff = (Date.now() - d.getTime())/1000;
  if(diff<60) return `${Math.round(diff)}s ago`;
  if(diff<3600) return `${Math.round(diff/60)}m ago`;
  if(diff<86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
};

// ---------- hero kpis ----------
function renderKpis(){
  $("#kpi-products").textContent = DATA.products.length;
  $("#kpi-platforms").textContent = DATA.platforms.length;
  $("#kpi-channels").textContent = DATA.ads.length;
  $("#kpi-audiences").textContent = DATA.audiences.length;
}

// ---------- catalog ----------
function renderCategories(){
  const cats = [...new Set(DATA.products.map(p=>p.category))].sort();
  const sel = $("#catalog-category");
  cats.forEach(c => sel.appendChild(el("option",{value:c}, c)));
}
function renderCatalog(){
  const q = $("#catalog-search").value.toLowerCase().trim();
  const cat = $("#catalog-category").value;
  const mar = $("#catalog-margin").value;
  const dif = $("#catalog-difficulty").value;

  const grid = $("#catalog-grid");
  grid.innerHTML = "";
  const filtered = DATA.products.filter(p=>{
    if(cat && p.category!==cat) return false;
    if(mar && p.margin!==mar) return false;
    if(dif && p.difficulty!==dif) return false;
    if(q){
      const blob = [p.name,p.category,p.hook,p.angle,p.why,p.audiences.join(" "),p.channels.join(" ")].join(" ").toLowerCase();
      if(!blob.includes(q)) return false;
    }
    return true;
  });

  if(!filtered.length){
    grid.appendChild(el("div",{class:"info-card"}, el("p",{}, "No products match those filters. Try clearing one.")));
    return;
  }

  filtered.forEach(p=>{
    const chips = [
      el("span",{class:`chip ${p.margin==="high"?"green":p.margin==="low"?"red":"amber"}`}, `${p.margin} margin`),
      el("span",{class:"chip"}, p.difficulty),
    ];
    const card = el("div",{class:"product-card", onclick:()=>openProduct(p)},
      el("div",{class:"product-head"}, el("div",{class:"product-emoji"}, p.emoji)),
      el("div",{class:"product-name"}, p.name),
      el("div",{class:"product-cat"}, p.category),
      el("div",{class:"product-meta"}, ...chips),
      el("div",{class:"product-blurb"}, p.hook),
      el("div",{class:"price-row"},
        el("span",{}, "COGS"), el("b",{}, p.cogs),
        el("span",{}, "Sell"), el("b",{}, p.sell)
      )
    );
    card.addEventListener("mousemove",(e)=>{
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX-r.left}px`);
    });
    grid.appendChild(card);
  });
}

function openProduct(p){
  const audienceNames = p.audiences
    .map(a => DATA.audiences.find(x=>x.key===a)?.name || a)
    .filter(Boolean);
  const platformNames = p.platforms
    .map(k => DATA.platforms.find(x=>x.key===k)?.name || k);
  const channelNames = p.channels
    .map(k => DATA.ads.find(x=>x.key===k)?.name || k);

  const body = $("#modal-body");
  body.innerHTML = "";
  body.appendChild(el("button",{class:"modal-close","data-close":""}, "×"));
  body.appendChild(el("div",{style:"font-size:40px"}, p.emoji));
  body.appendChild(el("h2",{}, p.name));
  body.appendChild(el("div",{class:"product-cat"}, p.category));

  const meta = el("div",{class:"badge-row", style:"margin-top:10px"},
    el("span",{class:`chip ${p.margin==="high"?"green":p.margin==="low"?"red":"amber"}`}, `${p.margin} margin`),
    el("span",{class:"chip"}, p.difficulty),
    el("span",{class:"chip"}, `COGS ${p.cogs}`),
    el("span",{class:"chip"}, `Sell ${p.sell}`),
  );
  body.appendChild(meta);

  body.appendChild(el("h4",{}, "Why this product"));
  body.appendChild(el("p",{}, p.why));

  body.appendChild(el("h4",{}, "The hook"));
  body.appendChild(el("p",{}, p.hook));

  body.appendChild(el("h4",{}, "Creative angle"));
  body.appendChild(el("p",{}, p.angle));

  body.appendChild(el("h4",{}, "Risks to know"));
  body.appendChild(el("p",{}, p.risks));

  body.appendChild(el("h4",{}, "Target audiences"));
  const ul1 = el("ul",{});
  audienceNames.forEach(a => ul1.appendChild(el("li",{}, a)));
  body.appendChild(ul1);

  body.appendChild(el("h4",{}, "Best ad channels"));
  const ul2 = el("ul",{});
  channelNames.forEach(a => ul2.appendChild(el("li",{}, a)));
  body.appendChild(ul2);

  body.appendChild(el("h4",{}, "Recommended platforms"));
  const ul3 = el("ul",{});
  platformNames.forEach(a => ul3.appendChild(el("li",{}, a)));
  body.appendChild(ul3);

  $("#modal").classList.add("open");
}

// ---------- platforms / ads / audiences / tools / rules ----------
function renderPlatforms(){
  const g = $("#platforms-grid");
  DATA.platforms.forEach(p=>{
    g.appendChild(el("div",{class:"info-card"},
      el("div",{style:"display:flex;align-items:center;gap:10px;margin-bottom:4px"},
        el("div",{style:`width:10px;height:10px;border-radius:50%;background:${p.color}`}),
        el("h3",{}, p.name),
        el("span",{class:"chip", style:"margin-left:auto"}, p.tag)
      ),
      el("p",{}, p.bestFor),
      el("h4",{style:"font-size:11px;color:var(--brand-2);text-transform:uppercase;letter-spacing:.4px;margin-top:10px"}, "Strengths"),
      listOf(p.strengths),
      el("h4",{style:"font-size:11px;color:var(--red);text-transform:uppercase;letter-spacing:.4px;margin-top:10px"}, "Watch-outs"),
      listOf(p.weaknesses),
      el("p",{style:"margin-top:10px;font-size:12px"}, el("b",{}, "Fees: "), p.fees),
    ));
  });
}
function listOf(items){
  const ul = el("ul",{class:"info-list"});
  items.forEach(i => ul.appendChild(el("li",{}, i)));
  return ul;
}

function renderAds(){
  const g = $("#ads-grid");
  DATA.ads.forEach(a=>{
    g.appendChild(el("div",{class:"info-card"},
      el("div",{style:"display:flex;align-items:center;justify-content:space-between"},
        el("h3",{}, a.name),
        el("span",{class:"chip"}, a.tag)
      ),
      el("h4",{style:"font-size:11px;color:var(--brand-2);text-transform:uppercase;letter-spacing:.4px;margin-top:10px"}, "Strengths"),
      listOf(a.strengths),
      el("h4",{style:"font-size:11px;color:var(--red);text-transform:uppercase;letter-spacing:.4px;margin-top:10px"}, "Watch-outs"),
      listOf(a.weaknesses),
      el("p",{style:"margin-top:10px;font-size:12px"}, el("b",{}, "CPM range: "), a.cpm),
      el("p",{style:"font-size:12px"}, el("b",{}, "Start with: "), a.start),
      el("h4",{style:"font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.4px;margin-top:10px"}, "Metrics to watch"),
      listOf(a.watch),
    ));
  });
}

function renderAudiences(){
  const g = $("#audiences-grid");
  DATA.audiences.forEach(a=>{
    g.appendChild(el("div",{class:"info-card"},
      el("h3",{}, a.name),
      el("p",{style:"font-size:12px"}, el("b",{}, "Where: "), a.where),
      el("p",{style:"font-size:12px"}, el("b",{}, "Buys: "), a.buys),
      el("p",{style:"font-size:12px;color:var(--muted)"}, a.why),
      el("h4",{style:"font-size:11px;color:var(--brand-2);text-transform:uppercase;letter-spacing:.4px;margin-top:10px"}, "Creative hooks"),
      listOf(a.hooks),
    ));
  });
}

function renderPlaybooks(){
  const g = $("#playbooks-grid");
  DATA.playbooks.forEach(pb=>{
    const ol = el("ol",{});
    pb.steps.forEach(s => ol.appendChild(el("li",{}, s)));
    g.appendChild(el("div",{class:"playbook"},
      el("h3",{}, pb.title),
      ol
    ));
  });
}

function renderTools(){
  const g = $("#tools-grid");
  DATA.tools.forEach(t=>{
    g.appendChild(el("a",{class:"tool", href:t.url, target:"_blank", rel:"noopener noreferrer"},
      el("div",{class:"tool-tag"}, t.tag),
      el("h4",{}, t.name),
      el("p",{}, t.why),
    ));
  });
}

function renderRules(){
  const g = $("#rules-grid");
  DATA.rules.forEach(r=>{
    g.appendChild(el("div",{class:"rule"},
      el("h4",{}, r.title),
      el("p",{}, r.text),
    ));
  });
}

// ---------- modal ----------
document.addEventListener("click", (e)=>{
  if(e.target.hasAttribute("data-close") || e.target.classList.contains("modal-close")){
    $("#modal").classList.remove("open");
  }
});
document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape") $("#modal").classList.remove("open");
});

// ---------- live feeds ----------
const REDDIT_SUBS = ["dropship","ecommerce","Shopify","FulfillmentByAmazon","smallbusiness"];
async function fetchReddit(){
  const sub = REDDIT_SUBS[Math.floor(Math.random()*REDDIT_SUBS.length)];
  const alt = REDDIT_SUBS.filter(s=>s!==sub);
  const urls = [sub, ...alt].map(s => `https://www.reddit.com/r/${s}/top.json?limit=6&t=week`);
  for(const url of urls){
    try {
      const r = await fetch(url, {headers:{"Accept":"application/json"}});
      if(!r.ok) continue;
      const j = await r.json();
      const posts = (j.data?.children||[]).map(c=>c.data).filter(p=>!p.stickied);
      if(posts.length) return posts;
    } catch(e){ continue; }
  }
  return [];
}
function renderReddit(posts){
  const wrap = $("#reddit-feed");
  wrap.innerHTML = "";
  if(!posts.length){
    wrap.appendChild(el("div",{class:"feed-item"},
      el("div",{class:"feed-title"}, "Live community feed couldn't load"),
      el("div",{class:"feed-meta"},
        el("span",{}, "Reddit may be rate-limiting. Hit Refresh in a minute."),
      )
    ));
    return;
  }
  posts.slice(0,6).forEach(p=>{
    const a = el("a",{class:"feed-item", href:`https://reddit.com${p.permalink}`, target:"_blank", rel:"noopener noreferrer"},
      el("div",{class:"feed-title"}, p.title),
      el("div",{class:"feed-meta"},
        el("span",{class:"chip"}, `r/${p.subreddit}`),
        el("span",{}, `▲ ${p.score}`),
        el("span",{}, `💬 ${p.num_comments}`),
        el("span",{}, fmtTime(new Date(p.created_utc*1000))),
      )
    );
    wrap.appendChild(a);
  });
}

async function fetchHN(){
  try {
    const r = await fetch("https://hn.algolia.com/api/v1/search_by_date?query=shopify%20OR%20dropshipping%20OR%20ecommerce%20OR%20%22tiktok%20shop%22&tags=story&hitsPerPage=8");
    const j = await r.json();
    return j.hits || [];
  } catch(e){ return []; }
}
function renderHN(hits){
  const wrap = $("#hn-feed");
  wrap.innerHTML = "";
  if(!hits.length){
    wrap.appendChild(el("div",{class:"feed-item"},
      el("div",{class:"feed-title"}, "News feed couldn't load — try Refresh"),
    ));
    return;
  }
  hits.slice(0,6).forEach(h=>{
    const url = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
    const a = el("a",{class:"feed-item", href:url, target:"_blank", rel:"noopener noreferrer"},
      el("div",{class:"feed-title"}, h.title || "(untitled)"),
      el("div",{class:"feed-meta"},
        el("span",{class:"chip"}, "HN"),
        el("span",{}, `▲ ${h.points||0}`),
        el("span",{}, `💬 ${h.num_comments||0}`),
        h.created_at ? el("span",{}, fmtTime(new Date(h.created_at))) : null,
      )
    );
    wrap.appendChild(a);
  });
}

// A curated "rising interest" feed — baked in, but rotated so each refresh shows
// a different slice. Keeps the section live-feeling even when external feeds fail.
const RISING = [
  {term:"cozy gaming", note:"Aesthetic gaming setups, pastel peripherals, female gamer niche."},
  {term:"silent walking", note:"Wellness trend → resistance bands, mindful walking shoes."},
  {term:"sleep tourism", note:"Sleep masks, weighted blankets, travel pillows."},
  {term:"dopamine decor", note:"Bright, maximalist home decor — color-blocked everything."},
  {term:"clean girl aesthetic", note:"Minimalist beauty, skincare, neutral tone apparel."},
  {term:"mob wife", note:"Fur coats, gold jewelry, red lipstick — Y2K glam revival."},
  {term:"run club", note:"Running accessories, hydration belts, branded caps."},
  {term:"pickleball", note:"Paddles, bags, apparel — fastest-growing sport in the US."},
  {term:"pet calming", note:"Anxiety beds, thunder shirts, pheromone diffusers."},
  {term:"tiny home / van life", note:"Compact appliances, solar chargers, storage hacks."},
  {term:"cold plunge at home", note:"Portable tubs, ice makers, recovery gear."},
  {term:"AI-free / analog", note:"Paper planners, film cameras, print-over-digital niche."},
  {term:"Stanley cup dupes", note:"Insulated tumblers, customization, Gen Z hydration."},
  {term:"ergonomic gaming", note:"Wrist rests, monitor arms, blue-light glasses."},
];
function renderRising(){
  const wrap = $("#trends-feed");
  wrap.innerHTML = "";
  const shuffled = [...RISING].sort(()=>Math.random()-0.5).slice(0,6);
  shuffled.forEach(t=>{
    wrap.appendChild(el("div",{class:"feed-item"},
      el("div",{class:"feed-title"}, t.term),
      el("div",{class:"feed-meta"},
        el("span",{class:"chip green"}, "Rising"),
        el("span",{}, t.note),
      )
    ));
  });
}

// ---------- orchestration ----------
async function refresh(){
  const tick = $("#pulse-tick");
  const fill = $("#pulse-fill");
  fill.style.width = "15%"; tick.textContent = "Scanning public signals…";

  renderRising();
  fill.style.width = "40%";
  tick.textContent = "Pulling seller community threads…";
  const [reddit, hn] = await Promise.all([fetchReddit(), fetchHN()]);
  fill.style.width = "75%";
  tick.textContent = "Rendering insights…";
  renderReddit(reddit);
  renderHN(hn);

  fill.style.width = "100%";
  const now = new Date();
  $("#last-updated").textContent = `Updated ${now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
  tick.textContent = `Pulse healthy · ${reddit.length + hn.length} fresh signals`;
  setTimeout(()=>{ fill.style.width = "55%"; }, 1200);
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", ()=>{
  renderKpis();
  renderCategories();
  renderCatalog();
  renderPlatforms();
  renderPlaybooks();
  renderAudiences();
  renderAds();
  renderTools();
  renderRules();

  $("#catalog-search").addEventListener("input", renderCatalog);
  $("#catalog-category").addEventListener("change", renderCatalog);
  $("#catalog-margin").addEventListener("change", renderCatalog);
  $("#catalog-difficulty").addEventListener("change", renderCatalog);
  $("#refresh").addEventListener("click", refresh);

  refresh();
  // Auto-refresh every 20 minutes if the tab stays open.
  setInterval(refresh, 20*60*1000);
});
