var http = require('http');
var url = require('url');
var winston = require('winston');
var RequestDetail = require('./request_detail');
var SourceProxy = require('./source_proxy');
var CacheProxy = require('./cache_proxy');
var ExpirationTracker = require('./expiration_tracker');
var cache_manager = require('./cache_manager').primary;
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

// Handle an individual request
ProxyServer.prototype.handleRequest = function(request, response) {
  // If we got a url
  var _this = this;
  var parsedUrl = url.parse(request.url, true);
  if (parsedUrl.query.url) {
    request.url = parsedUrl.query.url; // make this look like the exact desired request
    var detail = new RequestDetail(request);
    detail.on('ready', function() {
      // If the cache key is in the cache, and not expired - serve the cached version
      cache_manager.get(detail.cacheKey(), function(data) {
        if (data) {
          _this.serve(new CacheProxy(data), response);
        }
        // Otherwise, determine if we're allowed to hit the source
        else {
          // If it has a matcher key & that matcher key is over the limit
          // Serve back a warning of it being over the limit
          // TODO implement matchers
          var tracker = new ExpirationTracker('twitter', 3, 30);
          tracker.usesInInterval(function(num, total) {
            if (num >= total) {
              // TODO try again in...
              response.writeHead(400, { 'content-type': 'application/json' });
              response.end(JSON.stringify({ message: 'Rate limited' }));
            }
            else {
              var proxy = new SourceProxy(detail);
              proxy.on('response', function(res) {
                new CacheAgent(detail.cacheKey(), res, 10); // TODO time changes
              });
              _this.serve(proxy, response);
              tracker.used();
            }
          });
        }
      });
    });
  }
  // Otherwise, serve back and error that the url was missing
  else {

  }
};

// Export ProxyServer
module.exports = ProxyServer;
