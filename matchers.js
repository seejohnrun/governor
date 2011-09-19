// Matchers
var matchers = [
  // Unauthenticated calls to twitter REST API are subject to a 150/hour limit
  // per IP Address
  {
    name: 'twitterUnauthenticated',
    cacheFor: 3600,
    rateLimit: {
      count: 150,
      interval: 3600
    },
    criterion: function(detail) {
      var token = detail.parsedUrl.query.oauth_token;
      if (detail.path().indexOf('verify_credentials') === -1) return;
      if (!token && detail.host() === 'api.twitter.com') {
        return 'twitter';
      }
    }
  },
  // Authenticated calls to twitter REST API are subject to 350/hour limit
  // per oauth_token
  {
    name: 'twitterAuthenticated',
    cacheFor: 3600,
    rateLimit: {
      count: 350,
      interval: 3600
    },
    criterion: function(detail) {
      var token = detail.parsedUrl.query.oauth_token;
      if (detail.path().indexOf('verify_credentials') === -1) return;
      if (token && detail.host() === 'api.twitter.com') {
        return 'twitter-' + token;
      }          
    }
  },
  // Authenticated calls to facebook Graph API are subject to 600/600s
  // per oauth_token
  {
    name: 'facebookAuthenticated',
    cacheFor: 3600,
    rateLimit: {
      count: 600,
      interval: 600
    },
    criterion: function(detail) {
      var token = detail.parsedUrl.query.access_token;
      if (token && detail.host() === 'graph.facebook.com') {
        return 'facebook-graph-' + token;
      }          
    }
  },
  // Unauthenticated calls to facebook Graph API are subject to 100/24h
  {
    name: 'facebookAuthenticated',
    cacheFor: 3600,
    rateLimit: {
      count: 100,
      interval: 86400
    },
    criterion: function(detail) {
      var token = detail.parsedUrl.query.access_token;
      if (!token && detail.host() === 'graph.facebook.com') {
        return 'facebook-graph';
      }          
    }
  },
  // catch all - we assume that things thrown against this service were meant to be
  // cached, and not rate limited
  {
    name: 'default',
    cacheFor: 3600,
    criterion: function(detail) {
      return 'default';
    }
  }
];

module.exports = matchers;
