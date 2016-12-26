# Cache API FAQ

## What `cache` boxs can contains

It contains basically `request`s and `response`s and those things can be almost anything (images, scripts, etc..)

## How to open the `cache` to store things

```js
// when I open a `cache` that is not exists it will create it for me
caches.open('my-stuff).then(cache => {
  // do your things here ...
});
```

## How to add items to `cache`

```js
// the request is an url and the response can be the response of that request
cache.put(request, response);

// this takes an array of requests or url and store their responses
// remember this operation is atomic is one of the element fails everything fails  and nothing is saved
// this api uses `fetch` to fetch any resource
cache.addAll([
'/foo',
'/bar'
]);
```

## How to get things out of the cache

```js

//it search on the cache for that request or url and if it find the request and returne a `response` if not `null`
cache.match(request);

// do the same as above but matches on any cache starting on the oldest
caches.match(request);
```