var winston = require('winston');
var ProxyServer = require('./lib/proxy_server');

// Initialize winston
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: true, level: 'verbose' });

// And create the server
var server = new ProxyServer({ });
server.listenForever();
