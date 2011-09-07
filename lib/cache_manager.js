var winston = require('winston');
var redis = require('redis');

var CacheManager = function() {
  // TODO configurable
  this.redisClient = redis.createClient();
};

// Cache a given key/value
CacheManager.prototype.set = function(key, value) {
  this.redisClient.set(key, value);
};

// get the data for an individual key
CacheManager.prototype.get = function(key, callback) {
  this.redisClient.get(key, function(err, reply) {
    if (err) {
      winston.warn('error retrieving data for key: ' + err);
      callback(null);
    }
    else {
      callback(reply);
    }
  });
};

// Export a default copy of a CacheManager
exports.primary = new CacheManager();
