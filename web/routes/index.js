const express = require('express');
const logger = require('../../debug/logger');

const router = express.Router();

router.get('/', (req, res) => {
  logger.info(`/ GET: ${req}`);

  res.status(200).send();
});

module.exports = router;
