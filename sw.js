// Offline support: keeps the app shell in cache so it opens without internet.
const CACHE = "tatbeeq-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // never cache or intercept the data calls to Convex; the app handles those itself
  if (req.method !== "GET" || req.url.includes("convex.cloud")) return;
  // network first, fall back to the cached copy when offline
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.status === 200 || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
