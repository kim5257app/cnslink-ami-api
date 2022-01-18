const db = require('./db');
const web = require('./web');
const comm = require('./comm');
const config = require('./config/config');
const logger = require('./debug/logger');
const ami = require('./util/ami');

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

ami.deviceEntityIdByCtn({
  ctn: '01222430000',
  usim: '8982068086001950707F',
});
