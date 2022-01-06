const { onHandler } = require('../helper');

exports.rules = {
  'test.echo': {
    text: { type: 'string', maxLen: 128 },
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'test.echo', async (payload, resp) => {
    resp(payload);
  });
};
