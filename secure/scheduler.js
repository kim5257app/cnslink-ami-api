const db = require('../db');
const request = require('./request');
const secureQuery = require('../db/query/secure');

let items = [];
let handle = null;

async function secureProcess() {
  if (items.length === 0) {
    // DB에서 목록 가져오기
    items = await db.getInstance()
      .query(secureQuery.getSecureProcessList({}));
  }

  if (items.length > 0) {
    const [item] = items.splice(0, 1);

    // 요청
    switch (item.status) {
      case 0: {
        const res = await request.insertSecurePlatform(item);

        const info = (res.status === 201 || res.status === 409) ? {
          aei: res.data['m2m:ae'].aei,
          status: 1,
        } : {
          aei: null,
          status: 3,
        };

        const updatedItem = {
          ...item,
          ...info,
        };

        await db.getInstance()
          .query(secureQuery.updateInfo(updatedItem));

        items.splice(0, 0, updatedItem);
        break;
      }
      case 1: {
        const res = await request.getSecurePlatform(item);
        const info = (res.status === 200) ? {
          status: 2,
        } : {
          status: 3,
        };

        const updatedItem = {
          ...item,
          ...info,
        };

        await db.getInstance()
          .query(secureQuery.updateInfo(updatedItem));
        break;
      }
      default:
        break;
    }

    handle = setTimeout(secureProcess, 1000);
  } else {
    handle = null;
  }
}

async function beginSecureProcess() {
  if (handle == null) {
    await secureProcess();
  }
}

module.exports.beginSecureProcess = beginSecureProcess;
