const db = require('../../db/index');
const { onHandler } = require('../helper');
const Error = require('../../debug/error');
const secureQuery = require('../../db/query/secure');
const aftQuery = require('../../db/query/aft');
const ami = require('../../util/ami');
const secureScheduler = require('../../secure/scheduler');

exports.rules = {
  'secure.apply': {
    items: { type: 'array' },
  },
  'secure.apply.filter': {
    filters: { type: 'array' },
  },
  'secure.release.filter': {
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

    await secureScheduler.beginSecureProcess();

    resp({ result: 'success' });
  });

  onHandler(socket, 'secure.release.filter', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    // 정보 조회
    const items = await db.getInstance()
      .query(secureQuery.getSecureApply({
        page: 1,
        itemsPerPage: 100000,
        sortBy: [],
        sortDesc: [],
        filters: payload.filters,
      }));

    await db.getInstance()
      .query(secureQuery.releaseSecure(items));

    await secureScheduler.beginSecureProcess();

    resp({ result: 'success' });
  });

  onHandler(socket, 'secure.summary.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const item = await db.getInstance()
      .query(secureQuery.summarySecureApply(payload));

    resp({
      result: 'success',
      item,
    });
  });

  onHandler(socket, 'secure.list.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const items = await db.getInstance()
      .query(secureQuery.getSecureApply(payload));

    resp({
      result: 'success',
      items,
    });
  });
};
