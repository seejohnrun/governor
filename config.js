var config = {

  // The general application host and port
  host: '127.0.0.1',
  port: 8980,

  // Maximum sockets to open at once
  maxSockets: 1024,

  // How we should log
  logger: {
    type: 'Console',
    options: {
      colorize: true,
      level: 'verbose'
    }
  },

  // Matchers
  matchers: {
    // Unauthenticated calls to twitter REST API are subject to a 150/hour limit
    // per IP Address
    twitterUnauthenticated: {
      cacheFor: 3600,
      criterion: function(detail) { }
    },
    // Authenticated calls to twitter REST API are subject to 350/hour limit
    // per oauth_token
    twitterAuthenticated: {
      cacheFor: 3600,
      criterion: function(detail) { }
    },
    // catch all - we assume that things thrown against this service were meant to be
    // cached, and not rate limited
    default: {
      cacheFor: 3600,
      criterion: function(detail) {
        return 'default';
      }
    }
  }

};

module.exports = config;
