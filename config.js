var config = {

  // The general application host and port
  host: '127.0.0.1',
  port: 8980,

  // For customizing rate limit responses
  rateLimitCode: 420,
  rateLimitMessage: 'Hey, settle down.',

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

  // Configure the cache manager
  cache: {
    host: "127.0.0.1",
    port: 6379,
    db: 7
  }

};

module.exports = config;
