/* Service Worker: кэшируем оболочку приложения → работает офлайн */
const CACHE = 'sleep-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/apple-touch-icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* Установка: складываем файлы в кэш */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* Активация: удаляем старые версии кэша */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Стратегия: cache-first с фоллбэком в сеть.
   Шрифты Google Fonts тоже кэшируются — в standalone-режиме
   без сети приложение останется в своём фирменном виде. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        // Не кэшируем opaque-ответы (например, если что-то пошло не так)
        if (!res || res.status !== 200 || res.type === 'opaque') return res;

        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});