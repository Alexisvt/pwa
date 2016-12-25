let cacheName = 'weatherPWA-step-6-5';
var dataCacheName = 'weatherData-v1';
let filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/styles/inline.css',
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png'
];

self.addEventListener('install', (e) => {
  console.log(`[ServiceWorker] Install`);

  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== cacheName && key !== dataCacheName) {
          console.log(`[ServiceWorker] Removing old cache ${key}`);
          return caches.delete(key);
        }
      }))
    })
  );

  return self.clients.claim();
})

self.addEventListener('fetch', function (e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  let dataUrl = 'https://query.yahooapis.com/v1/public/yql';

  if (e.request.url.indexOf(dataUrl) > -1) {

    e.respondWith(
      caches.open(dataCacheName).then(cache => {
        return fetch(e.request).then(response => {
          cache.put(e.request.url, response.clone());
          return response;
        })
      })
    );

  } else {

    e.respondWith(
      caches.match(e.request).then(function (response) {
        return response || fetch(e.request);
      })
    );

  }
});
