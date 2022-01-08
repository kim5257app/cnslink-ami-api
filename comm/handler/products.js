const db = require('../../db/index');
const aftQuery = require('../../db/query/aft');
const { onHandler } = require('../helper');
const Error = require('../../debug/error');

exports.rules = {
  'products.summary.get': {
    filters: { type: 'array' },
  },
  'products.list.get': {
    page: { type: 'number', min: 0 },
    itemsPerPage: { type: 'number', min: 5, max: 100 },
    sortBy: { type: 'array' },
    sortDesc: { type: 'array' },
    filters: { type: 'array' },
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'products.summary.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const item = await db.getInstance()
      .query(aftQuery.summaryProducts(payload));

    resp({
      result: 'success',
      item,
    });
  });

  onHandler(socket, 'products.list.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const items = await db.getInstance()
      .query(aftQuery.getProducts(payload));

    resp({
      result: 'success',
      items,
    });
  });
};
