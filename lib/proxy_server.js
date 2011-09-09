var http = require('http');
var url = require('url');
var winston = require('winston');
var RequestDetail = require('./request_detail');
var SourceProxy = require('./source_proxy');
var CacheProxy = require('./cache_proxy');
var ExpirationTracker = require('./expiration_tracker');
var cache_manager = require('./cache_manager');
var CacheAgent = require('./cache_agent');

// Set up a new ProxyServer, with optional config
// host: the host to listen on
// port: the port to listen on
var ProxyServer = function(config) {
  if (!config) {
    config = {};
  }
  this.host = config.host || '127.0.0.1';
  this.port = config.port || 8980;
  this.matchers = config.matchers || {};
  http.Agent.maxSockets = config.maxSockets || 1024;
};

// Listen for incoming requests to handle forever
ProxyServer.prototype.listenForever = function() {
  var _this = this;
  this.server = http.createServer();
  this.server.on('request', function(request, response) {
    _this.handleRequest(request, response);
  });
  this.server.listen(this.port, this.host);
  winston.info('listening for requests on ' + this.host + ':' + this.port);
};

// Serve a proxy into a response
ProxyServer.prototype.serve = function(proxy, response) {
  // Reflect the response back to the client
  proxy.on('response', function(res) {
    response.writeHead(res.statusCode, res.headers);
    res.on('data', function(data) {
      response.write(data);
    });
    res.on('end', function(data) {
      response.end(data);
    });
    try {
      res.end();
    } catch (e) {
    }
  });
  // Show the errors to the client
  proxy.on('error', function(error) {
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: error.message }));
  });
  // And away we go
  proxy.end();
};

// Identify which matcher to use
ProxyServer.prototype.identifyMatcher = function(detail) {
  var matcher, result;
  for (var name in this.matchers) {
    matcher = this.matchers[name];
    result = matcher.criterion(detail);
    if (result) {
      winston.info('found match in ' + name);
      return {
        tracker: result,
        cacheFor: matcher.cacheFor,
        rateLimit: matcher.rateLimit
      };
    }
  }
};

// Return an error for a missing url
ProxyServer.prototype.handleMissingUrl = function(response) {
  response.writeHead(400, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ message: 'Missing URL' }));
};

// Handle an individual request
// TODO take a saw to this method
ProxyServer.prototype.handleRequest = function(request, response) {
  var _this = this;
  var parsedUrl = url.parse(request.url, true);
  // Make sure we have a url
  if (!parsedUrl.query.url) return this.handleMissingUrl(response);
  request.url = parsedUrl.query.url; // make this look like the exact desired request
  var detail = new RequestDetail(request);
  detail.on('ready', function() {
    // If the cache key is in the cache, and not expired - serve the cached version
    var cacheKey = detail.cacheKey();
    cache_manager.get(cacheKey, function(data) {
      if (data) {
        _this.serve(new CacheProxy(data), response);
      }
      // Otherwise, determine if we're allowed to hit the source
      else {
        // Construct our source proxy since we know we don't have a cached copy
        var proxy = new SourceProxy(detail);
        // If it has a matcher key & that matcher key is over the limit
        // Serve back a warning of it being over the limit
        var m = _this.identifyMatcher(detail);
        // If the matcher wants caching, enable it on the proxy
        if (m && m.cacheFor) {
          winston.verbose('will be caching response for ' + m.cacheFor + 's');
          proxy.on('response', function(res) {
            new CacheAgent(cacheKey, res, m.cacheFor);
          });
        }
        // If there is no rate limit, give a warning, otherwise, run through the tracker
        if (!m || !m.rateLimit) {
          winston.warn('no rate limit for ' + request.url);
          _this.serve(proxy, response);
        }
        else {
          var tracker = new ExpirationTracker(m.tracker, m.rateLimit.count, m.rateLimit.interval);
          tracker.usesInInterval(function(num, total) {
            if (num >= total) {
              response.writeHead(400, { 'content-type': 'application/json' });
              response.end(JSON.stringify({ message: 'Rate limited' }));
            }
            else {
              _this.serve(proxy, response);
              tracker.used();
              tracker.cleanUp(); // should clean up on a schedule in the future
            }
          });
        }
      }
    });
  });
};

// Export ProxyServer
module.exports = ProxyServer;
