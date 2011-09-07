var events = require('events');
var winston = require('winston');

/// RESPONSE

var CacheResponse = function(data) {
  this.statusCode = data.code;
  this.headers = data.headers;
  this.body = data.data;
};

CacheResponse.prototype = new events.EventEmitter;

CacheResponse.prototype.end = function() {
  this.emit('end', this.body);
};

/// PROXY

var CacheProxy = function(json) {
  this.data = JSON.parse(json);
};

CacheProxy.prototype = new events.EventEmitter;

CacheProxy.prototype.end = function() {
  winston.verbose('making cache call');
  this.emit('response', new CacheResponse(this.data));
};

// Export CacheProxy
module.exports = CacheProxy;
