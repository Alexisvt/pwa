# A Service Worker (SW) recipes

## Where is the MDN references about SW

[MDN Service Worker](https://mzl.la/2inQbu0)

## How do we register a SW

We do it in our firstScript.js file that we load

```js

// firstScript.js file

if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// sw.js

// ... SW logic here
```

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

## Where do we need to clean some states (for example clean the old cache)

We can do it on the `activate` event like this:

```js
const expectedCaches = [
  'static-v2'
];

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if(!expectedCaches.includes(cacheName))
          return caches.delete(cacheName);
      })
    ))
  );
})
```

## How to implement offline-first strategy using SW

We need to do:

1. First we need to present data from cache
2. Then request the rest to the network

The more that you present from the cache the better for that we will do the next:

```js

// Create an app shell which is a simple version of your app html but without dinamic content
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('static-v3')
    .then(cache => cache.addAll([
      '/shell.html',
      '/styles.css',
      'script.js'
    ]))
  );
});

// then in our fetch event we call the cache and then the network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // this is if for example we are taking some images from gravatar
  if(url.origin == 'https://gravatar.com'){
    event.respondWith(handleAvatarRequest(event));
    return;
  }

  if(url.origin == location.origin && url.pathname == '/') {
    event.respondWith(caches.match('shell.html'));
    return;
  }

  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  );
});

// simple one solution
/*
function handleAvatarRequest(event) {
  return fetch(event.request)
    .catch(() => caches.match('/fallback-avatar.png'));
}
*/

// the more robust solution
function handleAvatarRequest(event) {
  const networkFetch = fetch(event.request);

  event.waitUntil(
    networkFetch.then(response => {
      const responseClone = response.clone();
      caches.open('avatars')
        .then(cache => cache.put(event.request, responseClone));
    })
  );

  return caches.match(event.request)
    .then(response => response || networkFetch);
}
```


## What other type of storage can we use to save our data to use it on the offline-first strategy

We can use [idb librarie](https://www.npmjs.com/package/idb) which is a mirror of `indexedDB`

We can use it for example to store messages that comes for your server, lets pretends that our server respond with a json object like this:

```json
{
  "id": 44444123,
  "user": "999900011",
  "date": "2016-03-07",
  "text": "hola mundo"
}
```

The next code show an example of the JavaScript needed to store and read the data using `idb` librarie

```js

// we installed it using npm
import idb from "idb";

// creating the DB and the object store (table for related dbs)
const dbPromise = idb.open('messagesDb', 1, db => {
  const messages = db.createObjectStore('messages', {keyPath: 'id'});

  // a custom index to order by date
  messages.createIndex('by-date', 'date');
});

function onNewMessage(message) {

  // some function that take a message and present it to the page
  addToPage(message);

  // here is where we store the receiving message into the db
  dbPromise.then(db => {
    db.transaction('messages', 'readwrite')
      .objectStore('messages').add(message);
  });
}

// ...later in your app if we want to get those messages from the indexedDB
dbPromise.then(db => {
  return db.transaction('messages')
    .objectStore('messages').index('by-date').getAll();
}).then(allMessages => {
  addToPage(allMessages);
})
```

## How to just save a fixed amount of data in `indexedDB` using `idb` librarie

```js

// in this sample we are skipping the newest 30 items the others will be delete
dbPromise.then(db => {
  db.transaction('messages', 'readwrite')
    .objectStore('messages').index('by-date')
    .openCursor(null, 'prev')
    .then(cursor => cursor.advance(30))
    .then(function deleteRest(cursor) {
      if(!cursor) return;

      cursor.delete();
      cursor.continue().then(deleteRest);
    });
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

## How to update the `cache` in the SW

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

## Can you show me a little sample of **Background sync** (resiliant sending)

Sure! First this is an experimental feature and is not standardized yet. It works only on canaria chrome and others beta browsers (I think).

The use of this is when we want to communicate with the server later when we have connection but we want to give to the user some user experience

```js
page.js

function onMessageSend(message) {
  addToOutbox(message)
    .then(() => navigator.serviceWorker.ready)
    .then(reg => reg.sync.register('send-messages'))
    .catch(() => sendMessageToServer(message));
}

sw.js

self.addEventListener('sync', event => {
  if(event.tag == 'send-messages') {
    event.waitUntil(
      getMessagesFromOutbox().then(messages => {
        return sendMessageToServer(messages)
          .then(() => removeMessagesFromOutbox(messages));
      })
    );
  }
});

```