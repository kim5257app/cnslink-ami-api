const db = require('./db');
const web = require('./web');
const comm = require('./comm');
const config = require('./config/config');
const logger = require('./debug/logger');

(async () => {
  logger.info('DB initializing...');
  await db.initialize(config.db);
  logger.info('DB initialized');

  logger.info('Web initializing...');
  await web.initialize(config.web);
  logger.info('Web initialized');

  logger.info('Comm initializing...');
  comm.initialize({
    httpServer: web.server,
    web: config.web,
  });
  logger.info('Comm initialized');
})();
