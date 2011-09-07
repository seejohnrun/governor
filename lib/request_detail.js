var url = require('url');
var events = require('events');
var hashlib = require('hashlib');

// Get detail about a request in a convenient manner
var RequestDetail = function(request) {
  var _this = this;
  this.parsedUrl = url.parse(request.url, false);
  this.request = request;
  request.on('data', function(data) {
    this.buffer = this.buffer ? this.buffer.concat(data) : data;  
  });
  request.on('end', function() {
    _this.emit('ready');
  });
};

// We emit events
RequestDetail.prototype = new events.EventEmitter;

// Get the host
// TODO handle auth somewhere
RequestDetail.prototype.host = function() {
  return this.parsedUrl.hostname;
};

// Get the port
RequestDetail.prototype.port = function() {
  return this.parsedUrl.port;
};

// Piece the path back together
RequestDetail.prototype.path = function() {
  var str = '';
  if (this.parsedUrl.pathname) {
    str += this.parsedUrl.pathname;
  }
  if (this.parsedUrl.search) {
    str += this.parsedUrl.search;
  }
  if (this.parsedUrl.hash) {
    str += this.parsedUrl.hash;
  }
  return str;
};

// Get the request method
RequestDetail.prototype.method = function() {
  return this.request.method;
};

// Get the headers with some details changed
RequestDetail.prototype.headers = function() {
  var headers = this.request.headers;
  headers.host = this.host();
  return headers;
};

// Get a key to uniquely identify this request
// TODO make more robust
RequestDetail.prototype.cacheKey = function() {
  var str = '';
  str += this.method() + this.host() + this.path();
  return hashlib.md5(str);
};

// export RequestDetail
module.exports = RequestDetail;
