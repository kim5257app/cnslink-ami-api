const db = require('../../db/index');
const { onHandler } = require('../helper');
const Error = require('../../debug/error');
const secureQuery = require('../../db/query/secure');
const aftQuery = require('../../db/query/aft');
const ami = require('../../util/ami');

exports.rules = {
  'secure.apply': {
    items: { type: 'array' },
  },
  'secure.apply.filter': {
    filters: { type: 'array' },
  },
  'secure.summary.get': {
    filters: { type: 'array' },
  },
  'secure.list.get': {
    page: { type: 'number', min: 0 },
    itemsPerPage: { type: 'number', max: 100 },
    sortBy: { type: 'array' },
    sortDesc: { type: 'array' },
    filters: { type: 'array' },
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'secure.apply', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    await db.getInstance()
      .query(secureQuery.applySecure(payload.items));

    resp({ result: 'success' });
  });

  onHandler(socket, 'secure.apply.filter', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    // 정보 조회
    const items = await db.getInstance()
      .query(aftQuery.getProducts({
        page: 1,
        itemsPerPage: 100000,
        sortBy: [],
        sortDesc: [],
        filters: payload.filters,
      }));

    const applyItems = items.map((item) => ({
      ...item,
      entityId: ami.deviceEntityIdByCtn(item),
    }));

    await db.getInstance()
      .query(secureQuery.applySecure(applyItems));

    resp({ result: 'success' });
  });
};
