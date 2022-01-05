const Error = require('../debug/error');

exports.onHandler = (socket, name, cb) => {
  socket.on(name, async (payload, resp) => {
    try {
      await cb(payload, resp);
    } catch (error) {
      resp(Error.make(error));
    }
  });
};
