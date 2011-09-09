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
  }

};

module.exports = config;
