const { onHandler } = require('../helper');
const Error = require('../../debug/error');
const db = require('../../db');
const nmsQuery = require('../../db/query/nms');

exports.rules = {
  'nms.command.add': {
    cmd: { type: 'string', minLen: 1, maxLen: 1 },
    ctn: { type: 'array' },
    data: { type: 'string', maxLen: 128 },
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'nms.command.add', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    await db.getInstance()
      .query(nmsQuery.addCommand(payload));

    resp({ result: 'success' });
  });
};
