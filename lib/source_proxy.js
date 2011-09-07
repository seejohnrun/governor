var events = require('events');
var http = require('http');
var winston = require('winston');

// Create a new SourceProxy for RequestDetail detail
var SourceProxy = function(detail) {
  this.detail = detail; 
};

// We are an event emitter
SourceProxy.prototype = new events.EventEmitter;

// end is our signal that we're ready to rock
SourceProxy.prototype.end = function() {
  var options = {
    host: this.detail.host(),
    port: this.detail.port(),
    path: this.detail.path(),
    method: this.detail.method(),
    headers: this.detail.headers()
  };
  // TODO add support for HTTPS
  var _this = this;
  winston.verbose('making external ' + this.detail.method() + ' for ' + this.detail.cacheKey());
  var request = http.request(options);
  request.on('response', function(res) {
    _this.emit('response', res);
  });
  request.on('error', function(err) {
    _this.emit('error', err);
  });
  // And off to the races
  request.end(this.detail.buffer);
};

// Export SourceProxy
module.exports = SourceProxy;
