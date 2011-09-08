var events = require('events');

// A fake request class that we can emit into as we please
var FakeRequest = function(method, url, headers) {
  this.method = method
  this.url = url
  this.headers = headers;
}
FakeRequest.prototype = new events.EventEmitter;
FakeRequest.prototype.write = function(data) { this.emit('data', data); };
FakeRequest.prototype.end = function() { this.emit('end'); };
exports.FakeRequest = FakeRequest;

// A fake response class
var FakeResponse = function(code, headers) {
  this.statusCode = code;
  this.headers = headers;
};
FakeResponse.prototype = new events.EventEmitter;
FakeResponse.prototype.write = function(data) { this.emit('data', this.data); };
FakeResponse.prototype.end = function() { this.emit('end'); };
exports.FakeResponse = FakeResponse;
