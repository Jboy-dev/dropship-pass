// Dropship Pass — expanded app logic
const D = window.DROPSHIP_DATA;
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const el = (tag, props={}, ...children)=>{
  const n=document.createElement(tag);
  Object.entries(props).forEach(([k,v])=>{
    if(k==="class") n.className=v;
    else if(k==="html") n.innerHTML=v;
    else if(k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(),v);
    else n.setAttribute(k,v);
  });
  for(const c of children){ if(c==null) continue; n.appendChild(typeof c==="string"?document.createTextNode(c):c); }
  return n;
};
const fmtTime = d=>{const s=(Date.now()-d.getTime())/1000;if(s<60)return `${Math.round(s)}s ago`;if(s<3600)return `${Math.round(s/60)}m ago`;if(s<86400)return `${Math.round(s/3600)}h ago`;return `${Math.round(s/86400)}d ago`};
const usd = n=>"$"+Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
const pct = n=>`${(n*100).toFixed(1)}%`;

// ---------- favorites (localStorage) ----------
const FAV_KEY = "dropship.favs.v1";
const getFavs = ()=>{ try{return JSON.parse(localStorage.getItem(FAV_KEY)||"[]")}catch(e){return[]} };
const setFavs = favs => localStorage.setItem(FAV_KEY, JSON.stringify(favs));
const toggleFav = id => { const favs=getFavs(); const i=favs.indexOf(id); if(i>=0) favs.splice(i,1); else favs.push(id); setFavs(favs); return favs.includes(id); };
const isFav = id => getFavs().includes(id);

// ---------- toast ----------
let toastTimer;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2200); }

// ---------- KPIs ----------
function renderKpis(){
  $("#kpi-products").textContent = D.products.length;
  $("#kpi-platforms").textContent = D.platforms.length;
  $("#kpi-channels").textContent = D.ads.length;
  $("#kpi-audiences").textContent = D.audiences.length;
  $("#kpi-templates").textContent = D.adTemplates.length;
  $("#kpi-scripts").textContent = D.creativeScripts.length;
  animateNumbers();
}
function animateNumbers(){
  $$(".kpi-num").forEach(n=>{
    const target = parseInt(n.textContent,10); if(isNaN(target)) return;
    let cur=0; const step=Math.max(1,Math.ceil(target/30));
    const iv=setInterval(()=>{ cur+=step; if(cur>=target){cur=target;clearInterval(iv)} n.textContent=cur; },30);
  });
}

// ---------- daily featured pick ----------
function renderDaily(){
  const day = Math.floor(Date.now()/86400000);
  const p = D.products[day % D.products.length];
  $("#daily-date").textContent = new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"});
  const body = $("#daily-body"); body.innerHTML="";
  body.className = "daily-body";
  body.appendChild(el("div",{style:"font-size:48px"}, p.emoji));
  body.appendChild(el("div",{class:"daily-name"}, p.name));
  body.appendChild(el("div",{class:"daily-cat"}, p.category));
  body.appendChild(el("div",{class:"daily-meta"},
    el("span",{class:`chip ${p.margin==="high"?"green":"amber"}`}, `${p.margin} margin`),
    el("span",{class:"chip"}, `Heat ${p.heat}`),
    el("span",{class:"chip"}, `AOV ${p.aov}`)));
  body.appendChild(el("div",{class:"daily-why"}, p.why));
  body.appendChild(el("div",{class:"daily-cta"},
    el("button",{class:"btn-primary", onclick:()=>openProduct(p)}, "Open full play")));
}

// ---------- catalog ----------
let catalogView = "grid";
function renderCategories(){
  const cats = [...new Set(D.products.map(p=>p.category))].sort();
  const sel = $("#catalog-category");
  cats.forEach(c => sel.appendChild(el("option",{value:c}, c)));
}
function filterProducts(){
  const q = $("#catalog-search").value.toLowerCase().trim();
  const cat = $("#catalog-category").value;
  const mar = $("#catalog-margin").value;
  const dif = $("#catalog-difficulty").value;
  const sea = $("#catalog-season").value;
  let list = D.products.filter(p=>{
    if(cat && p.category!==cat) return false;
    if(mar && p.margin!==mar) return false;
    if(dif && p.difficulty!==dif) return false;
    if(sea){
      const hay = p.season.toLowerCase();
      if(sea==="year-round" && !hay.includes("year")) return false;
      if(sea==="summer" && !hay.includes("summer") && !hay.includes("jun") && !hay.includes("jul")) return false;
      if(sea==="Q4" && !hay.includes("q4") && !hay.includes("oct") && !hay.includes("nov") && !hay.includes("dec")) return false;
      if(sea==="Jan" && !hay.includes("jan")) return false;
      if(sea==="gift" && !hay.includes("gift") && !hay.includes("q4")) return false;
    }
    if(q){
      const blob = [p.name,p.category,p.hook,p.angle,p.why,p.audiences.join(" "),p.channels.join(" ")].join(" ").toLowerCase();
      if(!blob.includes(q)) return false;
    }
    return true;
  });
  if(catalogView==="heat") list = [...list].sort((a,b)=>b.heat-a.heat);
  if(catalogView==="saved"){ const favs=getFavs(); list = list.filter(p=>favs.includes(p.id)); }
  return list;
}
function productCard(p){
  const chips = [
    el("span",{class:`chip ${p.margin==="high"?"green":p.margin==="low"?"red":"amber"}`}, `${p.margin} margin`),
    el("span",{class:"chip"}, p.difficulty),
  ];
  const fav = isFav(p.id);
  const favBtn = el("button",{class:`fav-btn ${fav?"active":""}`, title:"Save", onclick:(e)=>{e.stopPropagation(); const now=toggleFav(p.id); e.currentTarget.classList.toggle("active", now); toast(now?"★ Saved":"Removed from saved"); if(catalogView==="saved") renderCatalog();}}, fav?"★":"☆");
  const card = el("div",{class:"product-card", onclick:()=>openProduct(p)},
    el("div",{class:"product-head"},
      el("div",{class:"product-emoji"}, p.emoji),
      favBtn),
    el("div",{class:"product-name"}, p.name),
    el("div",{class:"product-cat"}, p.category),
    el("div",{class:"product-meta"}, ...chips),
    el("div",{class:"product-blurb"}, p.hook),
    el("div",{class:"price-row"},
      el("span",{}, "COGS"), el("b",{}, p.cogs),
      el("span",{}, "Sell"), el("b",{}, p.sell)),
    el("div",{class:"heat-bar"}, el("div",{class:"heat-fill", style:`width:${p.heat}%`})),
    el("div",{class:"heat-score"},
      el("span",{}, `Heat ${p.heat}/100`),
      el("span",{}, `AOV ${p.aov}`))
  );
  card.addEventListener("mousemove",(e)=>{
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX-r.left}px`);
  });
  return card;
}
function renderCatalog(){
  const grid = $("#catalog-grid");
  grid.innerHTML = "";
  const list = filterProducts();
  if(!list.length){
    grid.appendChild(el("div",{class:"info-card"},
      el("p",{}, catalogView==="saved" ? "No saved products yet. Click the ☆ on any card to save it." : "No products match. Try clearing a filter.")));
    return;
  }
  list.forEach(p => grid.appendChild(productCard(p)));
}

// ---------- product modal + markdown export ----------
function productBriefMarkdown(p){
  const aud = p.audiences.map(a => D.audiences.find(x=>x.key===a)?.name || a).filter(Boolean);
  const plat = p.platforms.map(k => D.platforms.find(x=>x.key===k)?.name || k);
  const chs = p.channels.map(k => D.ads.find(x=>x.key===k)?.name || k);
  return `# ${p.emoji} ${p.name}
**Category:** ${p.category} · **Heat:** ${p.heat}/100 · **Margin:** ${p.margin} · **Difficulty:** ${p.difficulty}
**COGS:** ${p.cogs} · **Sell:** ${p.sell} · **AOV:** ${p.aov} · **Season:** ${p.season}

## Why this product
${p.why}

## The hook
${p.hook}

## Creative angle
${p.angle}

## Risks to know
${p.risks}

## Target audiences
${aud.map(a=>`- ${a}`).join("\n")}

## Best ad channels
${chs.map(a=>`- ${a}`).join("\n")}

## Recommended platforms
${plat.map(a=>`- ${a}`).join("\n")}
`;
}
function downloadMd(filename, md){
  const blob = new Blob([md], {type:"text/markdown"});
  const url = URL.createObjectURL(blob);
  const a = el("a",{href:url, download:filename}); document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}
function openProduct(p){
  const aud = p.audiences.map(a => D.audiences.find(x=>x.key===a)?.name || a).filter(Boolean);
  const plat = p.platforms.map(k => D.platforms.find(x=>x.key===k)?.name || k);
  const chs = p.channels.map(k => D.ads.find(x=>x.key===k)?.name || k);
  const body = $("#modal-body"); body.innerHTML = "";
  body.appendChild(el("button",{class:"modal-close","data-close":""}, "×"));
  body.appendChild(el("div",{style:"font-size:44px"}, p.emoji));
  body.appendChild(el("h2",{}, p.name));
  body.appendChild(el("div",{class:"product-cat"}, p.category));
  body.appendChild(el("div",{style:"display:flex;gap:6px;flex-wrap:wrap;margin-top:12px"},
    el("span",{class:`chip ${p.margin==="high"?"green":p.margin==="low"?"red":"amber"}`}, `${p.margin} margin`),
    el("span",{class:"chip"}, p.difficulty),
    el("span",{class:"chip"}, `Heat ${p.heat}/100`),
    el("span",{class:"chip"}, `COGS ${p.cogs}`),
    el("span",{class:"chip"}, `Sell ${p.sell}`),
    el("span",{class:"chip"}, `AOV ${p.aov}`),
    el("span",{class:"chip pink"}, p.season)));
  [["Why this product", p.why],["The hook", p.hook],["Creative angle", p.angle],["Risks to know", p.risks]].forEach(([h,t])=>{
    body.appendChild(el("h4",{}, h)); body.appendChild(el("p",{}, t));
  });
  const ul = (title,arr)=>{ body.appendChild(el("h4",{}, title)); const u=el("ul"); arr.forEach(x=>u.appendChild(el("li",{},x))); body.appendChild(u); };
  ul("Target audiences", aud);
  ul("Best ad channels", chs);
  ul("Recommended platforms", plat);
  body.appendChild(el("div",{class:"modal-actions"},
    el("button",{class:"btn-primary", onclick:()=>{ downloadMd(`${p.name.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-brief.md`, productBriefMarkdown(p)); toast("Brief downloaded"); }}, "↓ Download brief (.md)"),
    el("button",{class:"btn-ghost", onclick:()=>{ navigator.clipboard.writeText(productBriefMarkdown(p)); toast("Copied to clipboard"); }}, "Copy as markdown"),
    el("button",{class:"btn-ghost", onclick:()=>{ const now=toggleFav(p.id); toast(now?"★ Saved":"Removed"); openProduct(p); }}, isFav(p.id)?"★ Saved":"☆ Save")));
  $("#modal").classList.add("open");
}

// ---------- platforms / ads / audiences / playbooks / tools / rules ----------
const listOf = items => { const u=el("ul",{class:"info-list"}); items.forEach(i=>u.appendChild(el("li",{},i))); return u; };

function renderPlatforms(){
  const g = $("#platforms-grid"); g.innerHTML="";
  D.platforms.forEach(p => g.appendChild(el("div",{class:"info-card"},
    el("div",{style:"display:flex;align-items:center;gap:10px;margin-bottom:4px"},
      el("div",{style:`width:10px;height:10px;border-radius:50%;background:${p.color}`}),
      el("h3",{}, p.name),
      el("span",{class:"chip", style:"margin-left:auto"}, p.tag)),
    el("p",{}, p.bestFor),
    el("div",{class:"sub-h blue"}, "Strengths"), listOf(p.strengths),
    el("div",{class:"sub-h red"}, "Watch-outs"), listOf(p.weaknesses),
    el("p",{style:"margin-top:10px;font-size:12px"}, el("b",{}, "Fees: "), p.fees))));
}

function renderAds(){
  const g = $("#ads-grid"); g.innerHTML="";
  D.ads.forEach(a => g.appendChild(el("div",{class:"info-card"},
    el("div",{style:"display:flex;justify-content:space-between"},
      el("h3",{}, a.name), el("span",{class:"chip"}, a.tag)),
    el("div",{class:"sub-h blue"}, "Strengths"), listOf(a.strengths),
    el("div",{class:"sub-h red"}, "Watch-outs"), listOf(a.weaknesses),
    a.cpm? el("p",{style:"margin-top:10px;font-size:12px"}, el("b",{}, "CPM: "), a.cpm) : null,
    a.start? el("p",{style:"font-size:12px"}, el("b",{}, "Start: "), a.start) : null,
    a.watch? el("div",{class:"sub-h amber"}, "Metrics to watch") : null,
    a.watch? listOf(a.watch) : null)));
}

function renderAudiences(){
  const g = $("#audiences-grid"); g.innerHTML="";
  D.audiences.forEach(a => g.appendChild(el("div",{class:"info-card"},
    el("h3",{}, a.name),
    el("p",{style:"font-size:12px"}, el("b",{}, "Where: "), a.where),
    el("p",{style:"font-size:12px"}, el("b",{}, "Buys: "), a.buys),
    el("p",{style:"font-size:12px;color:var(--muted)"}, a.why),
    el("div",{class:"sub-h blue"}, "Creative hooks"), listOf(a.hooks))));
}

function renderPlaybooks(){
  let g = $("#playbooks-grid");
  if(!g){ // playbooks section was removed from markup; inject one.
    const sec = el("section",{id:"playbooks", class:"section"},
      el("div",{class:"section-head"},
        el("h2",{}, "How to sell — playbooks"),
        el("p",{}, "Step-by-step plays from what consistently works.")),
      el("div",{class:"playbook-grid", id:"playbooks-grid"}));
    document.querySelector("#audiences").before(sec);
    g = $("#playbooks-grid");
  }
  g.innerHTML="";
  D.playbooks.forEach(pb => {
    const ol = el("ol"); pb.steps.forEach(s => ol.appendChild(el("li",{}, s)));
    g.appendChild(el("div",{class:"playbook"}, el("h3",{}, pb.title), ol));
  });
}

function renderTools(){
  const g = $("#tools-grid"); g.innerHTML="";
  D.tools.forEach(t => g.appendChild(el("a",{class:"tool", href:t.url, target:"_blank", rel:"noopener noreferrer"},
    el("div",{class:"tool-tag"}, t.tag),
    el("h4",{}, t.name),
    el("p",{}, t.why))));
}

function renderRules(){
  const g = $("#rules-grid"); g.innerHTML="";
  D.rules.forEach(r => g.appendChild(el("div",{class:"rule"},
    el("h4",{}, r.title), el("p",{}, r.text))));
}

// ---------- templates / scripts / emails / calendar ----------
function renderTemplates(){
  const g = $("#templates-grid"); g.innerHTML="";
  D.adTemplates.forEach(t => {
    const full = `${t.hook}\n\n${t.body}\n\n${t.cta}`;
    g.appendChild(el("div",{class:"template-card"},
      el("button",{class:"copy-btn", onclick:()=>{navigator.clipboard.writeText(full); toast("Copied");}}, "Copy"),
      el("h4",{}, t.product),
      el("div",{class:"t-hook"}, t.hook),
      el("div",{class:"t-body"}, t.body),
      el("div",{class:"t-cta"}, t.cta)));
  });
}

function renderScripts(){
  const g = $("#scripts-grid"); g.innerHTML="";
  D.creativeScripts.forEach(s => {
    const ol = el("ol"); s.beats.forEach(b => ol.appendChild(el("li",{}, b)));
    g.appendChild(el("div",{class:"script-card"},
      el("h3",{}, s.name), ol,
      el("button",{class:"copy-btn", style:"position:static;margin-top:12px", onclick:()=>{navigator.clipboard.writeText(`${s.name}\n\n${s.beats.join("\n")}`); toast("Script copied");}}, "Copy script")));
  });
}

function renderEmails(){
  const g = $("#emails-grid"); if(!g) return;
  g.innerHTML="";
  D.emailTemplates.forEach(t => g.appendChild(el("div",{class:"email-card"},
    el("button",{class:"copy-btn", onclick:()=>{navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`); toast("Email copied");}}, "Copy"),
    el("div",{class:"e-flow"}, t.flow),
    el("div",{class:"e-subject"}, t.subject),
    el("div",{class:"e-body"}, t.body))));
}

function renderCalendar(){
  const g = $("#calendar-grid"); g.innerHTML="";
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const cur = new Date().getMonth();
  months.forEach((m,i)=>{
    const data = D.seasonalCalendar[m];
    const ul = el("ul"); data.hot.forEach(h => ul.appendChild(el("li",{}, h)));
    g.appendChild(el("div",{class:`month ${i===cur?"current":""}`},
      el("h4",{}, el("span",{class:"mo-name"}, names[i]), i===cur?el("span",{class:"chip green"},"Now"):null),
      el("div",{class:"m-theme"}, data.theme), ul));
  });
}

// ---------- calculators ----------
function calcProfit(){
  const sell = +$("#pm-sell").value || 0;
  const cogs = +$("#pm-cogs").value || 0;
  const ship = +$("#pm-ship").value || 0;
  const feesPct = (+$("#pm-fees").value || 0)/100;
  const fees = sell * feesPct;
  const profit = sell - cogs - ship - fees;
  const margin = sell? profit/sell : 0;
  const cls = margin>0.3?"good":margin>0.15?"warn":"bad";
  $("#pm-out").innerHTML="";
  $("#pm-out").append(
    line("Revenue", usd(sell)),
    line("Fees (on sale)", "− "+usd(fees)),
    line("Product + ship", "− "+usd(cogs+ship)),
    line("Profit / order", usd(profit), cls),
    line("Margin", pct(margin), cls));
}
function calcBreakeven(){
  const sell = +$("#br-sell").value || 0;
  const cost = +$("#br-cost").value || 0;
  const targetMargin = (+$("#br-margin").value || 0)/100;
  const contribution = sell - cost;
  const breakevenRoas = sell && contribution>0 ? sell/contribution : 0;
  const neededCPA = contribution>0 ? contribution - (sell*targetMargin) : 0;
  const targetRoas = neededCPA>0 && sell ? sell/neededCPA : 0;
  $("#br-out").innerHTML="";
  $("#br-out").append(
    line("Contribution / order", usd(contribution)),
    line("Breakeven ROAS", breakevenRoas.toFixed(2)+"×", contribution>0?"good":"bad"),
    line(`For ${$("#br-margin").value}% margin, target ROAS`, targetRoas>0?targetRoas.toFixed(2)+"×":"n/a", targetRoas>2?"good":targetRoas>1.5?"warn":"bad"),
    line("Max CPA at target", neededCPA>0?usd(neededCPA):"n/a"));
}
function calcAdBudget(){
  const spend = +$("#ad-spend").value || 0;
  const roas = +$("#ad-roas").value || 0;
  const cm = (+$("#ad-cm").value || 0)/100;
  const rev = spend * roas;
  const monthRev = rev * 30;
  const grossProfit = monthRev * cm;
  const netProfit = grossProfit - (spend * 30);
  const cls = netProfit>0?"good":"bad";
  $("#ad-out").innerHTML="";
  $("#ad-out").append(
    line("Daily revenue", usd(rev)),
    line("Monthly revenue", usd(monthRev)),
    line("Gross profit / mo", usd(grossProfit)),
    line("Ad spend / mo", "− "+usd(spend*30)),
    line("Net profit / mo", usd(netProfit), cls));
}
function calcAov(){
  const cur = +$("#aov-cur").value || 0;
  const nw = +$("#aov-new").value || 0;
  const orders = +$("#aov-orders").value || 0;
  const gm = (+$("#aov-gm").value || 0)/100;
  const delta = (nw-cur) * orders * gm;
  const yearly = delta * 12;
  const cls = delta>0?"good":"bad";
  $("#aov-out").innerHTML="";
  $("#aov-out").append(
    line("AOV uplift / order", usd(nw-cur)),
    line("Extra gross profit / mo", usd(delta), cls),
    line("Annual impact", usd(yearly), cls));
}
function line(label, value, cls){
  return el("div",{class:"calc-line"},
    el("span",{}, label),
    el("span",{class:`v ${cls||""}`}, value));
}
function wireCalcs(){
  ["#pm-sell","#pm-cogs","#pm-ship","#pm-fees"].forEach(id=>$(id).addEventListener("input",calcProfit));
  ["#br-sell","#br-cost","#br-margin"].forEach(id=>$(id).addEventListener("input",calcBreakeven));
  ["#ad-spend","#ad-roas","#ad-cm"].forEach(id=>$(id).addEventListener("input",calcAdBudget));
  ["#aov-cur","#aov-new","#aov-orders","#aov-gm"].forEach(id=>$(id).addEventListener("input",calcAov));
  calcProfit(); calcBreakeven(); calcAdBudget(); calcAov();
}

// ---------- command palette (⌘K) ----------
function buildIndex(){
  const out = [];
  D.products.forEach(p=>out.push({kind:"Product", icon:p.emoji, title:p.name, sub:p.category+" · Heat "+p.heat, action:()=>openProduct(p), search:[p.name,p.category,p.hook,p.why].join(" ")}));
  D.platforms.forEach(p=>out.push({kind:"Platform", icon:"🛍", title:p.name, sub:p.bestFor, href:"#platforms", search:[p.name,p.tag,p.bestFor].join(" ")}));
  D.ads.forEach(a=>out.push({kind:"Ad channel", icon:"📣", title:a.name, sub:a.tag, href:"#ads", search:[a.name,a.tag].join(" ")}));
  D.audiences.forEach(a=>out.push({kind:"Audience", icon:"👥", title:a.name, sub:a.where, href:"#audiences", search:[a.name,a.where,a.buys].join(" ")}));
  D.playbooks.forEach(pb=>out.push({kind:"Playbook", icon:"📘", title:pb.title, sub:"Step-by-step", href:"#playbooks", search:pb.title+" "+pb.steps.join(" ")}));
  D.tools.forEach(t=>out.push({kind:"Tool", icon:"🔧", title:t.name, sub:t.why, hrefExternal:t.url, search:[t.name,t.tag,t.why].join(" ")}));
  D.adTemplates.forEach(t=>out.push({kind:"Template", icon:"✍️", title:t.product+" — "+t.hook.slice(0,40)+"…", sub:"Ad copy", href:"#templates", search:[t.product,t.hook,t.body].join(" ")}));
  D.creativeScripts.forEach(s=>out.push({kind:"Script", icon:"🎬", title:s.name, sub:"Video script", href:"#scripts", search:s.name}));
  return out;
}
let PAL_INDEX = [];
let palSelected = 0;
let palResults = [];
function openPalette(){
  $("#palette").classList.add("open");
  $("#palette-input").value = "";
  $("#palette-input").focus();
  renderPalette("");
}
function closePalette(){ $("#palette").classList.remove("open"); }
function renderPalette(q){
  q = q.trim().toLowerCase();
  const all = PAL_INDEX;
  palResults = (q ? all.filter(i=>i.search.toLowerCase().includes(q)) : all).slice(0, 40);
  palSelected = 0;
  const r = $("#palette-results"); r.innerHTML="";
  if(!palResults.length){ r.appendChild(el("div",{class:"palette-empty"}, "No results.")); return; }
  palResults.forEach((it,i)=>{
    const row = el("div",{class:`palette-item ${i===0?"active":""}`, onclick:()=>runPalette(it)},
      el("div",{class:"palette-icon"}, it.icon),
      el("div",{class:"palette-main"},
        el("div",{class:"palette-title"}, it.title),
        el("div",{class:"palette-sub"}, it.sub||"")),
      el("div",{class:"palette-kind"}, it.kind));
    r.appendChild(row);
  });
}
function runPalette(item){
  closePalette();
  if(item.action) item.action();
  else if(item.hrefExternal) window.open(item.hrefExternal, "_blank", "noopener");
  else if(item.href) location.hash = item.href;
}
function palNav(dir){
  palSelected = (palSelected + dir + palResults.length) % palResults.length;
  $$("#palette-results .palette-item").forEach((n,i)=>n.classList.toggle("active", i===palSelected));
  const active = $$(".palette-item")[palSelected];
  if(active) active.scrollIntoView({block:"nearest"});
}

// ---------- regions ----------
function renderRegions(){
  const g = $("#regions-grid"); if(!g) return; g.innerHTML = "";
  D.regions.forEach(r => g.appendChild(el("div",{class:"info-card"},
    el("div",{style:"display:flex;align-items:center;gap:10px;margin-bottom:4px"},
      el("div",{style:"font-size:22px"}, r.flag),
      el("h3",{}, r.name),
      el("span",{class:"chip", style:"margin-left:auto"}, r.code)),
    el("p",{style:"font-size:13px"}, r.notes),
    el("div",{class:"sub-h blue"}, "Hot categories"), listOf(r.hot),
    el("div",{class:"sub-h amber"}, "Platforms"), listOf(r.platforms),
    el("div",{class:"sub-h green"}, "Ad channels"), listOf(r.channels))));
}

// ---------- FAQ ----------
function renderFaq(){
  const g = $("#faq-grid"); if(!g) return; g.innerHTML = "";
  D.faq.forEach((f,i) => {
    const item = el("div",{class:"faq-item"},
      el("div",{class:"faq-q"}, f.q),
      el("div",{class:"faq-a"}, f.a));
    item.querySelector(".faq-q").addEventListener("click", ()=> item.classList.toggle("open"));
    g.appendChild(item);
  });
}

// ---------- Launch checklist (persisted) ----------
const CHK_KEY = "dropship.chk.v1";
const getChk = ()=>{ try{return JSON.parse(localStorage.getItem(CHK_KEY)||"{}")}catch(e){return{}} };
const setChk = o => localStorage.setItem(CHK_KEY, JSON.stringify(o));
function renderChecklist(){
  const g = $("#checklist-grid"); if(!g) return; g.innerHTML = "";
  const state = getChk();
  let total = 0, done = 0;
  D.launchChecklist.forEach((phase, pi) => {
    const col = el("div",{class:"checklist-phase"}, el("h3",{}, phase.phase));
    phase.items.forEach((item, ii) => {
      const key = `${pi}.${ii}`; total++;
      const isDone = !!state[key]; if(isDone) done++;
      const row = el("div",{class:`chk-item ${isDone?"done":""}`},
        el("div",{class:"chk-box"}, "✓"),
        el("div",{}, item));
      row.addEventListener("click", ()=>{
        const s = getChk(); s[key] = !s[key]; setChk(s); renderChecklist();
      });
      col.appendChild(row);
    });
    g.appendChild(col);
  });
  const pct = total ? (done/total)*100 : 0;
  $("#progress-fill").style.width = pct+"%";
  $("#progress-text").textContent = `${done} of ${total} complete · ${pct.toFixed(0)}%`;
}

// ---------- CSV export ----------
function csvEscape(v){ const s = String(v??""); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
function exportCSV(){
  const cols = ["name","category","heat","margin","difficulty","cogs","sell","aov","season","audiences","channels","platforms","hook","angle","risks","why"];
  const rows = [cols.join(",")];
  D.products.forEach(p => rows.push(cols.map(c => csvEscape(Array.isArray(p[c]) ? p[c].join(";") : p[c])).join(",")));
  const blob = new Blob([rows.join("\n")], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = el("a",{href:url, download:`dropship-pass-catalog-${new Date().toISOString().slice(0,10)}.csv`});
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
  toast("CSV downloaded");
}

// ---------- Product comparison ----------
const CMP_KEY = "dropship.compare.v1";
const getCmp = ()=>{ try{return JSON.parse(localStorage.getItem(CMP_KEY)||"[]")}catch(e){return[]} };
const setCmp = a => localStorage.setItem(CMP_KEY, JSON.stringify(a));
function toggleCmp(id){
  const a = getCmp(); const i = a.indexOf(id);
  if(i>=0) a.splice(i,1);
  else { if(a.length>=4){ toast("Max 4 products to compare"); return false; } a.push(id); }
  setCmp(a); return true;
}
function openCompare(){
  const body = $("#compare-body"); body.innerHTML = "";
  body.appendChild(el("button",{class:"modal-close","data-close":""}, "×"));
  body.appendChild(el("h2",{}, "⚖ Compare products"));
  body.appendChild(el("p",{style:"font-size:13px;color:var(--muted);margin-top:4px"}, "Pick up to 4 products to see side-by-side. Saves in your browser."));

  const picker = el("div",{class:"compare-picker"});
  D.products.forEach(p => {
    const selected = getCmp().includes(p.id);
    const c = el("button",{class:`compare-chip ${selected?"active":""}`, onclick:()=>{
      if(toggleCmp(p.id)!==false) openCompare();
    }}, `${p.emoji} ${p.name}`);
    picker.appendChild(c);
  });
  body.appendChild(picker);

  const picked = getCmp().map(id => D.products.find(x=>x.id===id)).filter(Boolean);
  if(!picked.length){
    body.appendChild(el("div",{class:"compare-empty"}, "Select products above to compare."));
  } else {
    const grid = el("div",{class:"compare-grid"});
    picked.forEach(p => {
      const col = el("div",{class:"compare-col"},
        el("h3",{}, el("span",{}, `${p.emoji} ${p.name}`),
          el("button",{class:"compare-remove", onclick:()=>{ toggleCmp(p.id); openCompare(); }}, "×")),
        el("div",{class:"c-cat"}, p.category));
      const row = (k,v)=>el("div",{class:"compare-row"}, el("div",{class:"k"}, k), el("div",{class:"v"}, v));
      col.appendChild(row("Heat", `${p.heat}/100`));
      col.appendChild(row("Margin", p.margin));
      col.appendChild(row("Difficulty", p.difficulty));
      col.appendChild(row("COGS", p.cogs));
      col.appendChild(row("Sell", p.sell));
      col.appendChild(row("AOV", p.aov));
      col.appendChild(row("Season", p.season));
      col.appendChild(row("Hook", p.hook));
      col.appendChild(row("Angle", p.angle));
      col.appendChild(row("Risks", p.risks));
      grid.appendChild(col);
    });
    body.appendChild(grid);
  }
  $("#compare-modal").classList.add("open");
}

// ---------- live feeds ----------
const SUBS = ["dropship","ecommerce","Shopify","FulfillmentByAmazon","smallbusiness"];
async function fetchReddit(){
  const urls = SUBS.map(s => `https://www.reddit.com/r/${s}/top.json?limit=5&t=week`);
  const results = await Promise.allSettled(urls.map(u=>fetch(u,{headers:{"Accept":"application/json"}}).then(r=>r.ok?r.json():null)));
  const all = [];
  results.forEach(r=>{ if(r.status==="fulfilled" && r.value?.data?.children){ all.push(...r.value.data.children.map(c=>c.data).filter(p=>!p.stickied)); } });
  return all.sort((a,b)=>b.score-a.score).slice(0,8);
}
function renderReddit(posts){
  const w = $("#reddit-feed"); w.innerHTML="";
  if(!posts.length){ w.appendChild(el("div",{class:"feed-item"}, el("div",{class:"feed-title"}, "Reddit rate-limited — try Refresh in a minute"))); return; }
  posts.forEach(p=>w.appendChild(el("a",{class:"feed-item", href:`https://reddit.com${p.permalink}`, target:"_blank", rel:"noopener noreferrer"},
    el("div",{class:"feed-title"}, p.title),
    el("div",{class:"feed-meta"},
      el("span",{class:"chip"}, `r/${p.subreddit}`),
      el("span",{}, `▲ ${p.score}`), el("span",{}, `💬 ${p.num_comments}`),
      el("span",{}, fmtTime(new Date(p.created_utc*1000)))))));
}

// Commerce-news terms, queried strictly against titles with typo-tolerance off
// and a minimum-points gate so we don't get 1-point noise or "Spotify → Shopify"
// fuzzy mismatches. Multiple queries run in parallel and merge.
const HN_TERMS = ["shopify", "dropshipping", "ecommerce", "tiktok shop", "amazon seller", "woocommerce", "DTC brand", "Etsy"];
async function fetchHN(){
  const base = "https://hn.algolia.com/api/v1/search";
  const params = q => `?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=6&restrictSearchableAttributes=title&typoTolerance=false&numericFilters=points%3E8`;
  const queries = HN_TERMS.map(t => fetch(base + params(t)).then(r => r.ok ? r.json() : null).catch(()=>null));
  const results = await Promise.allSettled(queries);
  const seen = new Set();
  const all = [];
  results.forEach(r => {
    if(r.status !== "fulfilled" || !r.value?.hits) return;
    for(const h of r.value.hits){
      if(!h.title || seen.has(h.objectID)) continue;
      seen.add(h.objectID);
      all.push(h);
    }
  });
  // Quality-rank: points weighted by recency (half-life ~60 days).
  const now = Date.now();
  all.forEach(h => {
    const ageDays = h.created_at_i ? (now/1000 - h.created_at_i) / 86400 : 365;
    h._score = (h.points || 0) * Math.pow(0.5, ageDays/60) + (h.num_comments || 0) * 0.3;
  });
  all.sort((a,b) => b._score - a._score);
  return all.slice(0, 12);
}
function renderHN(hits){
  const w = $("#hn-feed"); w.innerHTML="";
  if(!hits.length){
    w.appendChild(el("div",{class:"feed-item"},
      el("div",{class:"feed-title"}, "Commerce news unavailable"),
      el("div",{class:"feed-meta"}, el("span",{}, "HN API may be rate-limiting — try Refresh."))));
    return;
  }
  hits.slice(0,8).forEach(h => {
    const href = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
    const host = h.url ? new URL(h.url).hostname.replace(/^www\./,"") : "news.ycombinator.com";
    w.appendChild(el("a",{class:"feed-item", href, target:"_blank", rel:"noopener noreferrer"},
      el("div",{class:"feed-title"}, h.title),
      el("div",{class:"feed-meta"},
        el("span",{class:"chip"}, host.length>24 ? host.slice(0,22)+"…" : host),
        el("span",{}, `▲ ${h.points||0}`),
        el("span",{}, `💬 ${h.num_comments||0}`),
        h.created_at ? el("span",{}, fmtTime(new Date(h.created_at))) : null)));
  });
}

async function fetchPH(){
  // Product Hunt RSS via a CORS-friendly proxy that exists publicly — fall back to curated if blocked.
  try {
    const r = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://www.producthunt.com/feed?category=undefined"));
    if(!r.ok) throw 0;
    const txt = await r.text();
    const doc = new DOMParser().parseFromString(txt, "text/xml");
    const items = [...doc.querySelectorAll("item")].slice(0,8).map(it=>({
      title: it.querySelector("title")?.textContent || "",
      link: it.querySelector("link")?.textContent || "",
      pub: it.querySelector("pubDate")?.textContent || ""
    }));
    if(items.length) return items;
  } catch(e){}
  return null;
}
function renderPH(items){
  const w = $("#ph-feed"); w.innerHTML="";
  if(!items || !items.length){
    // fallback: curated recent launch categories
    const fallback = [
      {title:"AI commerce tools surge — see what's launching", link:"https://www.producthunt.com/topics/e-commerce"},
      {title:"Headless Shopify alternatives trending", link:"https://www.producthunt.com/topics/shopify"},
      {title:"New dropship automation platforms", link:"https://www.producthunt.com/topics/dropshipping"},
      {title:"Creator-commerce tools", link:"https://www.producthunt.com/topics/creator-economy"}];
    fallback.forEach(f => w.appendChild(el("a",{class:"feed-item", href:f.link, target:"_blank", rel:"noopener noreferrer"},
      el("div",{class:"feed-title"}, f.title),
      el("div",{class:"feed-meta"}, el("span",{class:"chip"}, "PH Topic")))));
    return;
  }
  items.forEach(it => w.appendChild(el("a",{class:"feed-item", href:it.link, target:"_blank", rel:"noopener noreferrer"},
    el("div",{class:"feed-title"}, it.title),
    el("div",{class:"feed-meta"}, el("span",{class:"chip green"}, "New launch"), it.pub ? el("span",{}, fmtTime(new Date(it.pub))) : null))));
}

const RISING = [
  {term:"cozy gaming", note:"Aesthetic gaming setups, pastel peripherals."},
  {term:"silent walking", note:"Wellness trend — resistance bands, mindful walking shoes."},
  {term:"sleep tourism", note:"Sleep masks, weighted blankets, travel pillows."},
  {term:"dopamine decor", note:"Bright, maximalist home decor."},
  {term:"clean girl aesthetic", note:"Minimalist beauty, neutral tones."},
  {term:"mob wife", note:"Fur coats, gold jewelry, red lipstick — Y2K glam."},
  {term:"run club", note:"Running accessories, hydration belts, branded caps."},
  {term:"pickleball", note:"Paddles, bags, apparel — fastest-growing sport US."},
  {term:"pet calming", note:"Anxiety beds, thunder shirts, diffusers."},
  {term:"tiny home / van life", note:"Compact appliances, solar chargers."},
  {term:"cold plunge at home", note:"Portable tubs, ice makers, recovery."},
  {term:"AI-free / analog", note:"Paper planners, film cameras."},
  {term:"Stanley cup dupes", note:"Insulated tumblers, customization."},
  {term:"ergonomic gaming", note:"Wrist rests, monitor arms, blue-light."},
  {term:"matcha everything", note:"Whisks, bowls, matcha + adaptogens."},
  {term:"hair oiling", note:"Ayurvedic oils, scalp massagers."},
];
function renderRising(){
  const w = $("#trends-feed"); w.innerHTML="";
  const shuffled = [...RISING].sort(()=>Math.random()-0.5).slice(0,6);
  shuffled.forEach(t => w.appendChild(el("div",{class:"feed-item"},
    el("div",{class:"feed-title"}, t.term),
    el("div",{class:"feed-meta"}, el("span",{class:"chip green"}, "Rising"), el("span",{}, t.note)))));
}

// ---------- refresh orchestration ----------
async function refresh(){
  $("#last-updated").textContent = "Refreshing…";
  renderRising();
  const [reddit, hn, ph] = await Promise.all([fetchReddit(), fetchHN(), fetchPH()]);
  renderReddit(reddit); renderHN(hn); renderPH(ph);
  const now = new Date();
  $("#last-updated").textContent = `Updated ${now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
}

// ---------- modal close ----------
document.addEventListener("click",(e)=>{ if(e.target.hasAttribute("data-close") || e.target.classList.contains("modal-close")){ $("#modal").classList.remove("open"); $("#palette").classList.remove("open"); }});
document.addEventListener("keydown",(e)=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); openPalette(); return; }
  if(e.key==="Escape"){ $("#modal").classList.remove("open"); $("#palette").classList.remove("open"); return; }
  if($("#palette").classList.contains("open")){
    if(e.key==="ArrowDown"){ e.preventDefault(); palNav(1); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); palNav(-1); }
    else if(e.key==="Enter"){ e.preventDefault(); if(palResults[palSelected]) runPalette(palResults[palSelected]); }
  }
});

// ---------- init ----------
document.addEventListener("DOMContentLoaded", ()=>{
  renderKpis();
  renderDaily();
  renderCategories();
  renderCatalog();
  renderPlatforms();
  renderPlaybooks();
  renderAudiences();
  renderAds();
  renderTools();
  renderRules();
  renderTemplates();
  renderScripts();
  renderEmails();
  renderCalendar();
  renderRegions();
  renderFaq();
  renderChecklist();
  wireCalcs();
  PAL_INDEX = buildIndex();

  $("#catalog-search").addEventListener("input", renderCatalog);
  ["#catalog-category","#catalog-margin","#catalog-difficulty","#catalog-season"].forEach(id => $(id).addEventListener("change", renderCatalog));
  $$(".view-btn").forEach(b => b.addEventListener("click", ()=>{ $$(".view-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active"); catalogView = b.dataset.view; renderCatalog(); }));
  $("#refresh").addEventListener("click", refresh);
  $("#open-search").addEventListener("click", openPalette);
  $("#palette-input").addEventListener("input", e => renderPalette(e.target.value));
  $("#open-compare")?.addEventListener("click", openCompare);
  $("#export-csv")?.addEventListener("click", exportCSV);

  const toTop = $("#to-top");
  window.addEventListener("scroll", ()=>{ toTop.classList.toggle("show", window.scrollY>500); });
  toTop.addEventListener("click", ()=>window.scrollTo({top:0, behavior:"smooth"}));

  // PWA install prompt
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault(); deferredPrompt = e;
    if(!localStorage.getItem("dropship.install.dismissed")){
      $("#install-banner").hidden = false;
    }
  });
  $("#install-btn")?.addEventListener("click", async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; $("#install-banner").hidden = true;
  });
  $("#install-dismiss")?.addEventListener("click", ()=>{
    localStorage.setItem("dropship.install.dismissed", "1");
    $("#install-banner").hidden = true;
  });

  // Scroll progress bar + topbar shrink
  const progress = $("#scroll-progress");
  const topbar = document.querySelector(".topbar");
  window.addEventListener("scroll", ()=>{
    const h = document.documentElement;
    const pct = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    if(progress) progress.style.transform = `scaleX(${pct})`;
    if(topbar) topbar.classList.toggle("scrolled", window.scrollY > 20);
  }, {passive:true});

  // Staggered section reveal on scroll
  const sections = $$("section.section");
  sections.forEach(s => s.classList.add("reveal"));
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("revealed"); obs.unobserve(e.target); } });
  }, {rootMargin:"0px 0px -10% 0px", threshold:.08});
  sections.forEach(s => obs.observe(s));

  // Active nav highlighting
  const navLinks = $$(".nav a");
  const byId = {};
  navLinks.forEach(a => { const id = a.getAttribute("href")?.slice(1); if(id) byId[id] = a; });
  const navObs = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if(e.isIntersecting){
        navLinks.forEach(l => l.classList.remove("active"));
        const link = byId[e.target.id]; if(link) link.classList.add("active");
      }
    });
  }, {rootMargin:"-30% 0px -60% 0px", threshold:0});
  Object.keys(byId).forEach(id => { const el = document.getElementById(id); if(el) navObs.observe(el); });

  // Mobile menu toggle
  $("#mobile-menu")?.addEventListener("click", (e)=>{
    e.currentTarget.classList.toggle("open");
    document.body.classList.toggle("mobile-open");
  });
  $$(".nav a").forEach(a => a.addEventListener("click", ()=>{
    document.body.classList.remove("mobile-open");
    $("#mobile-menu")?.classList.remove("open");
  }));

  refresh();
  setInterval(refresh, 20*60*1000);
});
