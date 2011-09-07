var cache_manager = require('./cache_manager').primary;

// Given a key and a response, watch the response and cache it when its ready
var CacheAgent = function(key, response) {
  var _this = this;
  this.code = response.statusCode;
  this.headers = response.headers;
  response.on('data', function(data) {
    _this.buffer = _this.buffer ? _this.buffer.concat(data) : data;
  });
  response.on('end', function() {
    data = {
      code: _this.code,
      headers: _this.headers,
      data: _this.buffer ? _this.buffer.toString() : ''
    };
    cache_manager.set(key, JSON.stringify(data));
  });
};

// Export CacheAgent
module.exports = CacheAgent;
