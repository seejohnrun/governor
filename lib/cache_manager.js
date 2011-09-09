var winston = require('winston');
var redis = require('redis');

// A memoized redis client
exports.redisClient = function() {
  if (!this.commonRedisClient) {
    this.configure({});
  }
  return this.commonRedisClient;
};

// Configure the redis client
exports.configure = function(config) {
  var host = config.host || '127.0.0.1';
  var port = config.port || 6379;
  this.commonRedisClient = redis.createClient(port, host);
  // status
  winston.info('connecting to redis on ' + host + ':' + port);
  // Allow selecting of a db index
  if (config.db && config.db > 0) {
    this.commonRedisClient.select(config.db, function(err, reply) {
      if (err) {
        winston.error('error connecting to redis index: ' + index, { error: err.message });
        process.exit(1);
      }
      else {
        winston.info('selected redis db: ' + config.db);
      }
    });
  }
};

// Cache a given key/value
exports.set = function(key, value, expiration) {
  this.redisClient().setex(key, expiration, value, function(err, reply) {
    if (err) {
      winston.warn('unable to set cache for ' + key + ': ' + err);
    }
  });
};

// get the data for an individual key
exports.get = function(key, callback) {
  this.redisClient().get(key, function(err, reply) {
    if (err) {
      winston.warn('error retrieving data for key: ' + err);
      callback(null);
    }
    else {
      callback(reply);
    }
  });
};

exports.quit = function() {
  var _this = this;
  this.redisClient().quit(function() {
    _this.commonRedisClient = null;
  });
};

exports.flush = function() {
  this.redisClient().flushdb(function(err, reply) {
    if (err) {
      winston.warn('error flushing redis database', { error: err });
    }
    else {
      winston.info('redis database flushed');
    }
  });
};
