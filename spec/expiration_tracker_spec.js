var ExpirationTracker = require('../lib/expiration_tracker');
var cache_manager = require('../lib/cache_manager');

describe('ExpirationTracker', function() {

  beforeEach(function() {
    cache_manager.flush();
  });

  describe('usesInInterval', function() {

    it ('should decrement automatically over time', function() {
      var tracker = new ExpirationTracker('hello', 1, 0.05);
      tracker.used();
      waits(100); // fall out of bounds
      runs(function() {
        var _this = this;
        tracker.usesInInterval(function(num, total) {
          expect(num).toBe(0);
          _this.completed = true;
        });
      });
      waitsFor(function() {
        return this.completed;
      });
    });

  });

  describe('clear', function() {
    
    it ('should be able to clear for a tracking key', function() {
      var tracker = new ExpirationTracker('hello', 10, 10);
      tracker.used();
      tracker.clear();
      runs(function() {
        var _this = this;
        tracker.usesInInterval(function(num, total) {
          expect(num).toBe(0);
          _this.completed = true;
        });
      });
      waitsFor(function() {
        return this.completed;
      });
    });

  });

  describe('used', function() {

    it('should start tracking at 0', function() {
      var tracker = new ExpirationTracker('hello', 0, 10);
      runs(function() {
        var _this = this;
        tracker.usesInInterval(function(num, total) {
          expect(num).toBe(0);
          _this.completed = true;
        });
      });
      waitsFor(function() {
        return this.completed;
      });
    });

    it('be able to track a use', function() {
      var tracker = new ExpirationTracker('hello', 10, 10);
      tracker.used();
      runs(function() {
        var _this = this;
        tracker.usesInInterval(function(num, total) {
          expect(num).toBe(1);
          expect(total).toBe(10);
          _this.completed = true;
        });
      });
      waitsFor(function() {
        return this.completed;
      });
    });

    it('should continue to track over the line', function() {
      var tracker = new ExpirationTracker('hello', 0, 1);
      tracker.used();
      runs(function() {
        var _this = this;
        tracker.usesInInterval(function(num, total) {
          expect(num).toBe(1);
          expect(total).toBe(0);
          _this.completed = true;
        });
      });
      waitsFor(function() {
        return this.completed;
      });
    });

  });

  //////////////////

  it('should close the cache manager - really? (https://github.com/pivotal/jasmine/pull/56)', function() {
    cache_manager.quit();
  });

});

