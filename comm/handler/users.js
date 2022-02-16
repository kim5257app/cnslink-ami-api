const db = require('../../db/index');
const usersQuery = require('../../db/query/users');
const { onHandler } = require('../helper');
const { verifyIdToken } = require('../../firebase/auth');
const Error = require('../../debug/error');

exports.rules = {
  'users.verify': {
    token: { type: 'string' },
  },
  'users.name.update': {
    name: { type: 'string' },
  },
  'users.permission.update': {
    id: { type: 'string', maxLen: 64 },
    manager: { type: 'boolean', required: false },
    lookup: { type: 'boolean', required: false },
  },
  'users.list.get': {
  },
};

exports.initHandler = (io, socket) => {
  onHandler(socket, 'users.verify', async (payload, resp) => {
    const decodedIdToken = await verifyIdToken(payload.token);

    let userInfo = await db.getInstance()
      .query(usersQuery.getUserInfo({ id: decodedIdToken.uid }));

    if (userInfo == null) {
      // 사용자 신규 생성
      await db.getInstance()
        .query(usersQuery.addUserInfo({
          id: decodedIdToken.uid,
          email: decodedIdToken.email,
        }));

      // 정보 다시 가져오기
      userInfo = await db.getInstance()
        .query(usersQuery.getUserInfo({ id: decodedIdToken.uid }));
    }

    // 해당 연결에 사용자 정보 추가
    socket.data.userInfo = userInfo;

    if (userInfo.manager) {
      socket.join('manager');
    }

    resp({
      result: 'success',
      userInfo,
      decoded: decodedIdToken,
    });
  });

  onHandler(socket, 'users.permission.update', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.admin) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    // 대상 권한 정보 가져오기
    const targetOriginInfo = await db.getInstance()
      .query(usersQuery.getUserInfo({ id: payload.id }));

    await db.getInstance()
      .query(usersQuery.updatePermission({
        ...targetOriginInfo,
        ...payload,
      }));

    // 업데이트 후 다시 권한 정보 가져오기
    const targetUpdatedInfo = await db.getInstance()
      .query(usersQuery.getUserInfo({ id: payload.id }));

    resp({
      result: 'success',
      item: targetUpdatedInfo,
    });
  });

  onHandler(socket, 'users.list.get', async (payload, resp) => {
    const { userInfo } = socket.data;

    if (userInfo == null || !userInfo.admin) {
      Error.throwFail('ACCESS_DENIED', 'Access Denied');
    }

    const items = await db.getInstance()
      .query(usersQuery.getUserList());

    resp({
      result: 'success',
      items,
    });
  });
};
