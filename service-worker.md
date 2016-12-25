# A Service Worker (SW) FAQ

## Which are the event that a SW can subscribe

- `install`
- `activate`
- `fetch`


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