var redis = require('redis');
var winston = require('winston');
var cache_manager = require('./cache_manager');

// Initialize a new expiration tracker
// track - a string representing this track
// numberInInterval - the number that can happen in #intervalLength time
// intervalLength - the number of seconds representing an interval
var ExpirationTracker = function(track, numberInInterval, intervalLength) {
  this.numberInInterval = numberInInterval; // a count
  this.intervalLength = intervalLength; // in seconds
  this.track = 'cp:tracker:' + track;
  this.client = cache_manager.redisClient();
};

// Clear the track of all previous data and start over
ExpirationTracker.prototype.clear = function() {
  var _this = this;
  this.client.del(this.track, function(err, reply) {
    if (err) {
      winston.error('failed to clear tracking key for ' + _this.track + ': ' + err);
    }
    else {
      winston.verbose('cleared tracking key for ' + _this.track);
    }
  });
};

// Track a use
ExpirationTracker.prototype.used = function() {
  var time = new Date().getTime();
  var differentiator = Math.floor(Math.random() * 9999);
  var _this = this;
  this.client.zadd(this.track, time, time + differentiator, function(err, reply) {
    if (err) {
      wisnton.error('failed to log time for ' + _this.track + ': ' + err);
    }
    else {
      winston.verbose('logged use for ' + _this.track + ': ' + time);  
      _this.cleanNecessary = true;
    }
  });
};

// remove all of the old ones from -inf to the time we want to track
// this is just to keep things clear
ExpirationTracker.prototype.cleanUp = function() {
  // Do nothing if we don't have to
  if (!this.cleanNecessary) {
    return;
  }
  // Otherwise clean up old keys
  var intervalTime = new Date().getTime() - this.intervalLength * 1000;
  var _this = this;
  this.client.zremrangebyscore(this.track, '-inf', intervalTime, function(err, reply) {
    if (err) {
      winston.error('failed to clear old data for ' + _this.track + ': ' + err);
    }
    else {
      winston.verbose('cleared old keys for ' + _this.track + ' from -inf to ' + intervalTime);
      _this.cleanNecessary = false;
    }  
  });
};

// See how many uses there were within the interval specified backwards of now
ExpirationTracker.prototype.usesInInterval = function(callback) {
  var intervalTime = new Date().getTime() - this.intervalLength * 1000;
  var now = new Date().getTime();
  var completed = false, err, reply;
  // Get the count asynchronously
  var _this = this;
  this.client.zcount(this.track, intervalTime, now, function(err, reply) {
    // On error, return 0, and log a warning
    if (err) {
      winston.warn('unable to get proper count for ' + _this.track + ': ' + err);
      callback(0, _this.numberInInterval);
    }
    else {
      var num = reply ? parseInt(reply) : 0;
      callback(num, _this.numberInInterval);
    }
  });
};

module.exports = ExpirationTracker;
