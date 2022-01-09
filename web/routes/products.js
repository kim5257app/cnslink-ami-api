const express = require('express');
const logger = require('../../debug/logger');
const { verifyIdToken } = require('../../firebase/auth');
const db = require('../../db');
const usersQuery = require('../../db/query/users');
const aftQuery = require('../../db/query/aft');
const Error = require('../../debug/error');
const xlsx = require('../../util/xlsx');

const router = express.Router();

router.post('/file/xlsx', async (req, res) => {
  try {
    logger.info(`(${req.path}): ${req.body}`);
    const token = req.header('token');

    if (token == null) {
      Error.throwFail(
        'WRONG_ARGUMENT',
        'Wrong argument',
        400,
      );
    }

    const decodedIdToken = await verifyIdToken(req.header('token'));
    const userInfo = await db.getInstance()
      .query(usersQuery.getUserInfo({ id: decodedIdToken.uid }));

    if (userInfo == null || !userInfo.manager) {
      Error.throwFail(
        'ACCESS_DENIED',
        'Access Denied',
        401,
      );
    }

    // 정보 조회
    const items = await db.getInstance()
      .query(aftQuery.getProducts({
        page: 1,
        itemsPerPage: 1000,
        sortBy: [],
        sortDesc: [],
        filters: req.body.filters,
      }));

    res.status(200)
      .header({
        'Content-Transfer-Encoding': 'binary',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=list.xlsx',
      })
      .send(await xlsx.exportProducts(items));
  } catch (error) {
    const status = (error.code > 0) ? error.code : 500;
    res.status(status).json(error);
  }
});

module.exports = router;
