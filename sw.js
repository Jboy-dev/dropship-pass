// Dropship Pass service worker — cache-first for shell, network-first for live feeds.
const V = "dp-v2";
const SHELL = ["./","./index.html","./styles.css","./app.js","./data.js","./favicon.svg","./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Live-data endpoints: always try network first; fall back to cache only for shell.
  if(url.hostname.includes("reddit.com") || url.hostname.includes("hn.algolia.com") || url.hostname.includes("allorigins.win") || url.hostname.includes("producthunt.com")){
    e.respondWith(fetch(e.request).catch(()=>new Response("[]",{headers:{"Content-Type":"application/json"}})));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if(e.request.method==="GET" && resp.ok && url.origin===location.origin){
        const clone = resp.clone(); caches.open(V).then(c=>c.put(e.request, clone));
      }
      return resp;
    }).catch(()=>caches.match("./index.html")))
  );
});
