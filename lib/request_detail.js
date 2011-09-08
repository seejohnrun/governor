var url = require('url');
var events = require('events');
var hashlib = require('hashlib');

// Get detail about a request in a convenient manner
var RequestDetail = function(request) {
  var _this = this;
  this.parsedUrl = url.parse(request.url, false);
  this.request = request;
  request.on('data', function(data) {
    _this.buffer = _this.buffer ? _this.buffer.concat(data) : data;  
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

// Get the protocol
RequestDetail.prototype.protocol = function() {
  return this.parsedUrl.protocol.slice(0, -1);
};

// Get the port
RequestDetail.prototype.port = function() {
  if (typeof(this.parsedUrl.port) === 'undefined') {
    if (this.protocol() == 'http') {
      return 80;
    }
    else if (this.protocol() === 'https') {
      return 443;
    }
  }
  else {
    return parseInt(this.parsedUrl.port);
  }
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
  var headers = this.request.headers || {};
  headers.host = this.host();
  return headers;
};

// A list of headers that should not affect caching
RequestDetail.ignoredHeaders = [
  'accept', 'accept-charset', 'accept-encoding', 'accept-language',
  'cache-control', 'connection', 'user-agent', 'if-modified-since'
];

// Get a key to uniquely identify this request
RequestDetail.prototype.cacheKey = function() {
  // The basics
  var str = this.request.method + this.request.url;
  // Also add in the body if there is one
  if (this.buffer) {
    str += this.buffer.toString();
  }
  // And if there is an authentication header, throw that in too for good measure
  if (this.request.headers) {
    for (var key in this.request.headers) {
      if (RequestDetail.ignoredHeaders.indexOf(key.toLowerCase()) === -1) {
        str += key + this.request.headers[key];
      }
    }
  }
  return hashlib.md5(str);
};

// export RequestDetail
module.exports = RequestDetail;
