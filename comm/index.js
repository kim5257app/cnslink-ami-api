const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const logger = require('../debug/logger');
const Error = require('../debug/error');

const test = require('./handler/test');
const users = require('./handler/users');
const products = require('./handler/products');
const status = require('./handler/status');
const nms = require('./handler/nms');

const rules = {
  ...test.rules,
  ...users.rules,
  ...products.rules,
  ...status.rules,
  ...nms.rules,
};

/**
 *
 * @param {{[name]: any} | undefined} rule
 * @param {{[name]: any}} obj
 */
function checkField(rule, obj) {
  let ret = true;

  if (rule != null) {
    Object.entries(rule).forEach(([key, value]) => {
      if (obj[key] == null) {
        // 옵션 필드라면 통과
        ret = (value.required != null && !value.required);
      } else {
        // 타입 확인
        if (ret && value.type != null) {
          let type = typeof obj[key];
          type = (type === 'object') && (obj[key] instanceof Array) ? 'array' : type;

          if (value.type !== type) {
            ret = false;
          } else if (value.type === 'object') {
            ret = checkField(value.children, obj[key]);
          }
        }

        // 최대 길이 확인
        if (ret && value.maxLen != null) {
          ret = (obj[key].length <= value.maxLen);
        }

        // 최소 길이 확인
        if (ret && value.minLen != null) {
          ret = (obj[key].length >= value.minLen);
        }

        // 숫자 범위 확인
        if (ret && value.max != null) {
          ret = (obj[key] <= value.max);
        }

        if (ret && value.min != null) {
          ret = (obj[key] >= value.min);
        }

        // 허용 값 확인
        if (ret && value.allow != null) {
          ret = (value.allow.find((item) => item === obj[key]) != null);
        }
      }
    });
  } else {
    ret = false;
  }

  return ret;
}

function checkForm(socket) {
  socket.use(([name, payload, resp], next) => {
    if (resp == null) {
      next(Error.makeFail('WRONG_ARGUMENT', 'No response callback'));
    } else if (!checkField(rules[name], payload)) {
      resp(Error.makeFail('WRONG_ARGUMENT', 'Wrong argument'));
    } else {
      next();
    }
  });
}

function initialize({ httpServer, redis }) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Redis Cluster 설정
  if (redis != null) {
    const pubClient = createClient(redis);
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on('connection', (socket) => {
    logger.info(`connection: ${socket.id}`);

    checkForm(socket);

    socket.on('error', (error) => {
      logger.error(error);
      socket.disconnect();
    });

    test.initHandler(io, socket);
    users.initHandler(io, socket);
    products.initHandler(io, socket);
    status.initHandler(io, socket);
    nms.initHandler(io, socket);
  });
}

module.exports.initialize = initialize;
