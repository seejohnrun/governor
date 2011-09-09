# Governor

Governor is an node server that listens for requests, and replays then to a final destination.  This is useful for a few reasons:

* As a caching layer for certain types of requests
* As a way to consistently avoid rate limiting from external services

## How it works

Start up governor using `npm install && npm start` and then, start routing requests through governor, so a request that used to look like:

    [GET] http://api.twitter.com/v1/users/show?screen_name=seejohnrun

Will now look like:

    [GET] http://localhost:8980?url=http://api.twitter.com/v1/users/show?screen_name=seejohnrun

All of the original headers, errors, body, etc from the response will be streamed back to you as governor receives it.  It will also be cached, so that next time you make the exact same request, you retrieve it from the cache.  This works with all HTTP verbs.

## Matchers

Matcher are how you tell _governor_ what do with certain responses.  A simple example would be:

``` javascript
matchers: {
  twitter: {
    cacheFor: 3600,
    rateLimit: {
      count: 150,
      interval: 3600
    },
    criterion: function(detail) {
      if (detail.host() === 'api.twitter.com') {
        return 'twitter';
      } 
    }
  }
}
``` 

What this will do, is upon receiving a request that returns a truthy response from criterion, will cache the response for an hour, rate limit it to 150 requests per hour, with the rate limiting based on the key "twitter".  You can use this to single rate limiting down to the access details of the user making the call (to track rate limits per `access_token` for example).  The cacheFor and rateLimit pieces are both optional.

## Custom Rate Limit Responses

Some web services (like Twitter) have started using 420 to indicate rate limiting instead of the more traditional 400.  _Governor_ uses 400 by default, but you can override it (and the message that comes along with it) using:

``` javascript
{
  rateLimitCode: 420,
  rateLimitMessage: 'Why do you have to do it?'
}
```

## Author

* [John Crepezzi](mailto:john.crepezzi@gmail.com) at [Brewster](http://brewster.com) 
