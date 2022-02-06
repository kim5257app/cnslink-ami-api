const xmlParser = require('xml-js');
const db = require('../db');
const request = require('./request');
const secureQuery = require('../db/query/secure');
const comm = require('../comm/index');

let items = [];
let taskItems = [];
let handle = null;

async function secureProcess() {
  if (items.length === 0) {
    // DB에서 목록 가져오기
    items = await db.getInstance()
      .query(secureQuery.getSecureProcessList({}));
  }

  if (taskItems.length === 0) {
    taskItems = await db.getInstance()
      .query(secureQuery.getSecureTaskList({}));
  }

  if (items.length > 0) {
    const [item] = items.splice(0, 1);

    // 요청
    switch (item.status) {
      case 0: {
        const res = await request.insertSecurePlatform(item);
        const data = xmlParser.xml2js(res.data, { compact: true });

        console.log('insert:', res.status, JSON.stringify(data));

        const info = (res.status === 201 || res.status === 409) ? {
          // eslint-disable-next-line no-underscore-dangle
          aei: data['m2m:ae'].aei._text,
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

        console.log('get:', res.status, JSON.stringify(res.data));

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
      case 4: {
        const res = await request.deleteSecurePlatform(item);

        console.log('delete:', res.status, JSON.stringify(res.data));

        const info = (res.status === 200 || res.status === 404 || res.status === 403) ? {
          status: 5,
        } : {
          status: 6,
        };

        const updatedItem = {
          ...item,
          ...info,
        };

        await db.getInstance()
          .query(secureQuery.updateInfo(updatedItem));
        break;
      }
      case 5: {
        const res = await request.getSecurePlatform(item);

        console.log('get2:', res.status, JSON.stringify(res.data));

        if (res.status === 404) {
          await db.getInstance()
            .query(secureQuery.removeSecure(item));
        } else {
          await db.getInstance()
            .query(secureQuery.updateInfo({
              ...item,
              status: 6,
            }));
        }
        break;
      }
      default:
        break;
    }

    // 처리 중 정보를 공지
    comm.getInstance().to('manager').emit('secure.process.notify', {
      remain: items.length,
    });

    handle = setTimeout(secureProcess, 1000);
  } else if (taskItems.length > 0) {
    const [item] = taskItems.splice(0, 1);

    switch (item.task) {
      case 'status': {
        const res = await request.getSecureStatus(item);

        console.log('secure status:', res.status, JSON.stringify(res.data));

        const updatedItem = (res.status === 200) ? {
          no: item.no,
          result: 1,
        } : {
          no: item.no,
          result: 2,
        };

        // 정상 조회인 경우 상태 정보를 DB에 추가
        if (updatedItem.result === 1) {
          const status = res.data['m2m:cin'];
          status.con = JSON.parse(status.con);

          await db.getInstance()
            .query(secureQuery.insertSecureStatus({
              iccid: item.iccid,
              ctn: item.ctn,
              checkTime: status.ct,
              flowTotal: status.con.mesurement_info.flow_total,
              rssi: status.con.status.communication.RSSI,
              reversedPulse: status.con.status.sensor.reversed_pulse,
              lowMainBattery: status.con.status.battery.low_main_battery,
            }));
        }

        await db.getInstance()
          .query(secureQuery.updateSecureTask(updatedItem));
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
