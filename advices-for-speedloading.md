# Performance tips

> [resume](https://1drv.ms/i/s!AnLw2TAmdFo-g1sxYGbOmjKzareq)

- Keep your assets small as possible (images, html files, JavaScript files, CSS files, etc)
- Enable the compression on the server side for your files (static or dinamic)
  - There is a little performance gain when you minify your files
- Make the app interactive as soon as possible
  - use on your `script` tag the special `defer` and `async` keywords (we can use both as the same time)
    - [MDN Script tag reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
    - [Image sample use case](https://1drv.ms/i/s!AnLw2TAmdFo-g1VBV_BV3w1DjVSF)
  - There is no such thing on css but we can use libraries to load css async
    - Use with caution [loadCSS](https://github.com/filamentgroup/loadcss)
    - The rule of thumb is to show the Regional/Critical and then the rest. We can design or css to asign the size of the element first and then the rest. [Guitar tuner sample](http://bit.ly/2htgi4F) is a good one sample of Regional/Critial css practice
  - Defer iFrames, here is a simple solution that not work in all cases, use it only for non critical iframes [simple solution](https://1drv.ms/i/s!AnLw2TAmdFo-g1ZgjHKEZsA1G2xp)
  - Conserving Data using http headers and http caching
    - http headers solution
      - (Server response) Http response header: use `etag` and `last-modified` properties information to decide when locally need to download something new, see [response header sample](https://1drv.ms/i/s!AnLw2TAmdFo-g1fsmw33AIOzoUnv)
      - (Client request) http request headers we request a new version and we include two properties with the information that the response give us, the server will respond with a `304` status code, which means **not modified** [request header sample](https://1drv.ms/i/s!AnLw2TAmdFo-g1hCnfYDfyVMsER3)
    - http caching
      - caching tell the browser how long it is allow to consider this version of a document fresh, [sample](https://1drv.ms/i/s!AnLw2TAmdFo-g1mkjcCS7kNx68K9)
      - [A good rule for how long we must cache a file](https://1drv.ms/i/s!AnLw2TAmdFo-g1onotTEE3TLkGr4)
      - So we will do two things
        1. set the cache of all our resouces files to a couple of years
        2. then set a hash number to the name of the file name that will change everytime that we change something, a good tool for do that is Gulp and this [gulp-rev](http://bit.ly/2i7U5cK) plugin
  - Adapt the site to use HTTP 2 asap
    - Http 2 Push
      - Polymer uses, and the pattern is called **PRPL**
    - For doing test over http 2 we can use [simplehttp2server](http://bit.ly/2ieswwK)