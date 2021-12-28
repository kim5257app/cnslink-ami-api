const web = require('./web');
const comm = require('./comm');
const config = require('./config/config');

(async () => {
  await web.initialize(config.web);
  comm.initialize({ httpServer: web.server });
})();
