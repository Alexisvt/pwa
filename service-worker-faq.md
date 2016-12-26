# A Service Worker (SW) FAQ

## Which are the event that a SW can subscribe

- `install`
- `activate`
- `fetch`


## When Do we need to start to store in the `cache` whe we use SW

We basically do it on the `install` event

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