# Governor

Governor is an node server that listens for requests, and replays then to a final destination.  This is useful for a few reasons:

* As a caching layer for certain types of requests
* As a way to consistently avoid rate limiting from external services

---

## How it works

Start up governor using `npm install && npm start` and then, start routing requests through governor, so a request that used to look like:

    [GET] http://api.twitter.com/v1/users/show?screen_name=seejohnrun

Will now look like:

    [GET] http://localhost:8980?url=http://api.twitter.com/v1/users/show?screen_name=seejohnrun

All of the original headers, errors, body, etc from the response will be streamed back to you as governor receives it.  It will also be cached, so that next time you make the exact same request, you retrieve it from the cache.  This works with all HTTP verbs.

## Notes for expansion

When I'm ready to write the rest of the README be sure to mention

* only cache less than 400 responses
* settings

---

## Author

* [John Crepezzi](mailto:john.crepezzi@gmail.com) at [Brewster](http://brewster.com) 
