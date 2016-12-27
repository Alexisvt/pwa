# A Service Worker (SW) recipes

## Which are the event that a SW can subscribe

- `install`
- `activate`
- `fetch`
- `message`
- `controllerChange`
- `updatefound`


## When Do we need to start to store in the `cache` whe we use SW

We basically do it on the `install` event in that moment we request all the important data into the `cache api`

```js
// sw.js

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('our-cache-name')
    .then(cache => caches.addAll([
      '/offline-resource.html',
      '/styles.css'
    ]))
  );
});
```

## How to response with the cache data that we store early using SW

We need to do it on the `fetch` event and use the `request` object

```js
// sw.js

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    // if we need to handle when we can find the resource in our cache
    .then(response => response || fetch(event.request))
    .catch( () => {
      if(event.request.mode == 'navigate'){
        return caches.match('offline-resource.html');
      }
    })
  );
});
```

## How to response with a custom response using SW

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    new Response('<div>This is a custom response</div>', {
      headers: {
        'Content-Type': 'text/html'
      }
    })
  );
})
```

## How to response with a custom resource using `fetch` api

Sinces fetch responses with a `Response` type we can mix it with `respondWith`

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch('some-resource-url')
  );
})
```

## How to response to a specific url with something specific

```js
// this sample response with an image with the url ends with .jpg
self.addEventListener('fetch', function (event) {

  let {url} = event.request;

  if (url.endsWith('.jpg')) {

    event.respondWith(
      fetch('/imgs/dr-evil.gif')
    );
  }
});
```

## How to create a custom response when the response of the server is 404 using SW

```js
self.addEventListener('fetch', function (event) {

  event.respondWith(
    fetch(event.request).then(response => {
      if(response.status == 404) {
        return new Response('Whoops, not found');
      }
      return response;
    })
    .catch( () => new Response('Uh oh, that totally failed!'))
  );
});
```

## How to response with an image when the response of the server is `404`

```js
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.status === 404) {
        // remember fetch resolves to a Response type
        return fetch('/imgs/dr-evil.gif');
      }
      return response;
    }).catch(function() {
      return new Response("Uh oh, that totally failed!");
    })
  );
});
```

## How to update the Static Cache in `SW`

There are two ways to do this, let's take a look to the easy way to do it

Fist we need to get rid off the old `cache`

```js
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.delete('name-of-old-cache');
  )
});
```

Next we need to change the name or the version of the cache

```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('newest-cache-version-name').then(cache => {
      // do what you want with the new cache ...
    })
  );
})
```

The last method is the most robust

```js
// fist we need to declare a variable name for our cache
let staticCacheName = 'wittr-static-v3';

// then we need to make sure that the name is being use in the install event

self.addEventListener('install', function(event) {
  event.waitUntil(
    // TODO: change the site's theme, eg swap the vars in public/scss/_theme.scss
    // Ensure at least $primary-color changes
    // TODO: change cache name to 'wittr-static-v2'
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/your-resource1',
        '/your-resource2',
        '/etc',
      ]);
    })
  );
});

// then inside the activate event we need to do the next:
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.filter(cacheName => cacheName.startsWith('wittr-') && cacheName != staticCacheName)
        .map(cacheName => caches.delete(cacheName))
    ))
  );
});
```

**Note**: Both of these methods will return a promise

## How to notify the user that there is a newest version of the site

For this task we need to do a lot of things, fist we need to explain every piece of the puzzle

```js

// this code goes where we are making the registration process - registration.js
if ('serviceWorker' in navigator){

  var indexController = this;

  // We need to extends the logic of the registration process and use the registration object
  navigator.serviceWorker.register('/sw.js').then(function(reg) {

    // the controller property tell us if the current page is controlled by a sw
    // if not this page have the latest sw because is null in this moment of the
    // registration
    // page didn't load using a service worker
    if (!navigator.serviceWorker.controller) {
      return;
    }

    // service worker whose ServiceWorker.state is installed
    if (reg.waiting) {
      _updateReady(reg.waiting);
      return;
    }

    // Returns a service worker whose state is installing
    if (reg.installing) {
      _trackInstalling(reg.installing);
      return;
    }

    // it is fired any time the ServiceWorkerRegistration.installing property 
    // acquires a new service worker
    reg.addEventListener('updatefound', function() {
      _trackInstalling(reg.installing);
    });
  });

  // Ensure refresh is only called once.
  // This works around a bug in "force update on reload".
  var refreshing;
  // it is fired any time the ServiceWorkerRegistration.installing property acquires a new service worker
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}

_trackInstalling = function(worker) {

  // we need to subscribe to listen when the statechange change
  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      _updateReady(worker);
    }
  });
};


_updateReady = function(worker) {
  // this how we communicate to a sw
  // remember the sw doesn't have access to the DOM
  // We need to register to a event called message to catch this event
  // the value of the postMessage is an json like object
  worker.postMessage({action: 'skipWaiting'});
};


// this code is in the service worker script - sw.js

// this code will call when postMessage is sending a message
self.addEventListener('message', function(event) {

  // the idea here is to detect the specific message in this case is skipWaiting
  if (event.data.action === 'skipWaiting') {
    // skipWaiting() method of the ServiceWorkerGlobalScope forces
    // the waiting service worker to become the active service worker
    self.skipWaiting();
  }
});

```