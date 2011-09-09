var ExpirationTracker = require('../lib/expiration_tracker');
var cache_manager = require('../lib/cache_manager');

describe('ExpirationTracker', function() {

  beforeEach(function() {
    cache_manager.flush();
  });

  afterEach(function() {
    cache_manager.quit();
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

});

