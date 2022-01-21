const axios = require('axios');
const { citygas: request } = require('../config/config').adapt;

const host = `${request.protocol}://${request.host}:${request.port}`;

async function insertSecurePlatform({ ctn, entityId, serviceCode }) {
  return axios({
    url: `${host}/~/CB00053/uplus1-${serviceCode}`,
    headers: {
      'Content-Type': 'application/vnd.onem2m-res+xml;ty=2',
      Accept: 'application/json',
      'X-M2M-Origin': 'S',
      'X-M2M-RI': 12345,
    },
    method: 'post',
    responseType: 'json',
    data: {
      'm2m:ae': {
        rn: `ae-${entityId}`,
        api: `api-${entityId}`,
        rr: false,
        dkey: ctn,
      },
    },
    validateStatus: () => true,
  });
}

async function getSecurePlatform({ aei, entityId, serviceCode }) {
  return axios({
    url: `${host}/~/CB00053/uplus1-${serviceCode}/ae-${entityId}`,
    headers: {
      Accept: 'application/json',
      'X-M2M-Origin': aei,
      'X-M2M-RI': 12345,
    },
    method: 'get',
    responseType: 'json',
    validateStatus: () => true,
  });
}

async function deleteSecurePlatform({ aei, entityId, serviceCode }) {
  return axios({
    url: `${host}/~/CB00053/uplus1-${serviceCode}/ae-${entityId}`,
    headers: {
      'X-M2M-Origin': aei,
      'X-M2M-RI': 12345,
    },
    method: 'delete',
    responseType: 'json',
    validateStatus: () => true,
  });
}

module.exports.insertSecurePlatform = insertSecurePlatform;
module.exports.getSecurePlatform = getSecurePlatform;
module.exports.deleteSecurePlatform = deleteSecurePlatform;
