/* Only encrypted content is cached. Profile history stays encrypted in IndexedDB. */
'use strict';
const SHELL = 'stepone-shell-v1';
const CONTENT = 'stepone-content-v1';
const BASE = new URL('./', self.location.href);
const shellFiles = ['index.html', 'app.js', 'core.js', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'credentials.json'];
async function cached(cacheName, request) {
  try { return await (await caches.open(cacheName)).match(request); }
  catch (_) { return undefined; }
}
async function remember(cacheName, request, response) {
  if (!response.ok) return;
  try { await (await caches.open(cacheName)).put(request, response.clone()); }
  catch (_) { /* A full cache must never prevent an online response. */ }
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(shellFiles.map(path => new URL(path, BASE).href))));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('stepone-') && ![SHELL, CONTENT].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const isContent = url.pathname.endsWith('.bin');
  const isPage = /\/assets\/book\/page-\d+\.bin$/.test(url.pathname);
  if (isContent && isPage) {
    event.respondWith((async () => {
      const found = await cached(CONTENT, event.request); if (found) return found;
      const response = await fetch(event.request); await remember(CONTENT, event.request, response); return response;
    })());
    return;
  }
  event.respondWith((async () => {
    const cacheName = isContent ? CONTENT : SHELL;
    try { const response = await fetch(event.request); await remember(cacheName, event.request, response); return response; }
    catch (error) { const found = await cached(cacheName, event.request); if (found) return found; if (event.request.mode === 'navigate') { const index = await cached(SHELL, new URL('index.html', BASE)); if (index) return index; } throw error; }
  })());
});
