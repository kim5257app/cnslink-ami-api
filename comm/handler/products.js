const db = require('../../db/index');
const aftQuery = require('../../db/query/aft');
const { onHandler } = require('../helper');
const Error = require('../../debug/error');
const ami = require('../../util/ami');

exports.rules = {
  'products.summary.get': {
    filters: { type: 'array' },
  },
  'products.list.get': {
    page: { type: 'number', min: 0 },
    itemsPerPage: { type: 'number', max: 100 },
    sortBy: { type: 'array' },
    sortDesc: { type: 'array' },
    filters: { type: 'array' },
  },
  'products.ctn.update': {
    mode: { type: 'string', allow: ['prevent', 'skip'] },
    items: { type: 'array' },
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'products.summary.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
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

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const items = await db.getInstance()
      .query(aftQuery.getProducts(payload));

    resp({
      result: 'success',
      items,
    });
  });

  onHandler(socket, 'products.ctn.update', async (payload, resp) => {
    try {
      const { userInfo } = socket.data;

      if (userInfo == null || !userInfo.manager) {
        Error.throwFail('ACCESS_DENIED', 'Access Denied');
      }

      await db.getInstance()
        .query(aftQuery.updateCtn(payload.items));

      resp({ result: 'success' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const start = error.message.indexOf('Duplicate entry ') + 'Duplicate entry '.length + 1;
        const end = error.message.indexOf(' for key \'ctn\'') - 1;

        resp({
          result: 'error',
          name: 'DUPLICATED',
          message: 'Duplicate CTN value',
          meta: {
            duplicatedCtn: error.message.slice(start, end),
          },
        });
      }
    }
  });
};
