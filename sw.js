/*
 * Offline support. The app's own data already lives in localStorage, so once
 * these files are cached the whole thing works on a plane.
 *
 * Bump CACHE when this file changes; old caches are dropped on activate.
 */
/* BUILD-INJECTED: scripts/inject-sw-assets.mjs rewrites the two lines below on
 * every build — the version, so a new deploy gets a fresh cache, and the list
 * of hashed JS/CSS files, so the app is fully offline after its first load
 * rather than only after a second visit. */
const CACHE = 'budget-abroad-831644bb'
const ASSETS = ["./assets/index-BRIReMEJ.css","./assets/index-Cc42UUvH.js"]

const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icons/icon-180.png', ...ASSETS]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // One missing file must not fail the whole install.
      .then(c => Promise.all(SHELL.map(url => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // Exchange rates and Firestore are someone else's servers — never cache them.
  if (url.origin !== self.location.origin) return

  // Opening the app: prefer a fresh page, fall back to the cached one offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    )
    return
  }

  // Everything else (hashed JS/CSS, icons): cache first, it can't go stale —
  // a new build has new filenames.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(req, copy))
      }
      return res
    }))
  )
})
