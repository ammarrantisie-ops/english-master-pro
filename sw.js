/* English Master Pro — Service Worker
 * يجعل التطبيق يعمل بدون إنترنت بعد أول فتحة.
 * كما يخزّن content.json مؤقتاً ليظهر آخر محتوى عند عدم الاتصال. */
const CACHE = 'emp-v8';
const ASSETS = [
  './',
  './index.html',
  './content.json',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // جرّب الشبكة أولاً للمحتوى المركزي حتى تظهر تعديلات المعلم فوراً،
  // وارجع للذاكرة المؤقتة عند انقطاع الإنترنت.
  if (url.pathname.endsWith('content.json')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || Response.error()))
    );
    return;
  }

  // بقية الملفات: ذاكرة مؤقتة أولاً ثم شبكة.
  e.respondWith(
    caches.match(req).then((m) => m || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});