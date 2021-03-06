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
  var buffer = new Buffer(this.body);
  buffer = buffer.fromHex(); // since that's how we stored it
  this.emit('end', buffer);
};

/// PROXY

var CacheProxy = function(json) {
  this.data = JSON.parse(json);
};

CacheProxy.prototype = new events.EventEmitter;

CacheProxy.prototype.end = function() {
  winston.verbose('streaming response from cache');
  this.emit('response', new CacheResponse(this.data));
};

// Export CacheProxy
module.exports = CacheProxy;
