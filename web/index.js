const express = require('express');
const http = require('http');
const cors = require('cors');
const logger = require('../debug/logger');

const indexRoutes = require('./routes/index');

const app = express();

app.use(cors());

// 웹 요청 경로 설정
app.use('/', indexRoutes);

const server = http.createServer(app);

function initialize(args) {
  return new Promise((resolve) => {
    server.listen(args.port, () => {
      logger.info(`http server listen: ${args.port}`);
      resolve();
    });
  });
}

module.exports.server = server;
module.exports.initialize = initialize;
