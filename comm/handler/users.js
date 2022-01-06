const db = require('../../db/index');
const usersQuery = require('../../db/query/users');
const { onHandler } = require('../helper');
const { verifyIdToken } = require('../../firebase/auth');

exports.rules = {
  'users.verify': {
    token: { type: 'string' },
  },
  'users.name.update': {
    name: { type: 'string' },
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
        .query(usersQuery.addUserInfo({ id: decodedIdToken.uid }));

      // 정보 다시 가져오기
      userInfo = await db.getInstance()
        .query(usersQuery.getUserInfo({ id: decodedIdToken.uid }));
    }

    // 해당 연결에 사용자 정보 추가
    socket.data.userInfo = userInfo;

    resp({
      result: 'success',
      userInfo,
      decoded: decodedIdToken,
    });
  });
};
