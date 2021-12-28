const { Server } = require('socket.io');
const logger = require('../debug/logger');

function initialize({ httpServer }) {
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    logger.info(`connection: ${socket.id}`);
  });
}

module.exports.initialize = initialize;
