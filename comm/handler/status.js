const db = require('../../db/index');
const statusQuery = require('../../db/query/status');
const { onHandler } = require('../helper');
const Error = require('../../debug/error');

exports.rules = {
  'status.summary.get': {
    filters: { type: 'array' },
  },
  'status.list.get': {
    page: { type: 'number', min: 0 },
    itemsPerPage: { type: 'number', max: 100 },
    sortBy: { type: 'array' },
    sortDesc: { type: 'array' },
    filters: { type: 'array' },
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'status.summary.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const item = await db.getInstance()
      .query(statusQuery.summaryStatus(payload));

    resp({
      result: 'success',
      item,
    });
  });

  onHandler(socket, 'status.list.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const items = await db.getInstance()
      .query(statusQuery.getStatus(payload));

    resp({
      result: 'success',
      items,
    });
  });
};
