var winston = require('winston');
var fs = require('fs');
var ProxyServer = require('./lib/proxy_server');
var cache_manager = require('./lib/cache_manager');
var config = require('./config');

// Initialize winston, default stdout
winston.remove(winston.transports.Console);
if (config.logger) {
  winston.add(winston.transports[config.logger.type], config.logger.options);
} else {
  winston.add(winston.transports.Console, { colorize: true, level: 'verbose' });
}

// Set up the cache client
cache_manager.configure(config.cache);

// And create the server
var server = new ProxyServer({
  host: config.host,
  port: config.port,
  matchers: config.matchers,
  maxSockets: config.maxSockets
});
server.listenForever();
