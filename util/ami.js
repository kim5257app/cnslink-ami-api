/* eslint no-bitwise: ["off"] */

const crypto = require('crypto');

function javaHash(input) {
  const md5Bytes = crypto.createHash('md5').update(input).digest();
  md5Bytes[6] &= 0x0f; // clear version
  md5Bytes[6] |= 0x30; // set to version 3
  md5Bytes[8] &= 0x3f; // clear variant
  md5Bytes[8] |= 0x80; // set to IETF variant
  return md5Bytes.toString('hex');
}

function deviceEntityIdByCtn({ ctn, usim, serviceCode }) {
  const hash = javaHash(`${ctn}${usim}`);
  return `ASN_CSE-D-${hash.slice(0, 5)}${hash.slice(-5)}-${serviceCode}`;
}

function sliceNumber(val, start, end) {
  return parseInt(val.slice(start, end), 10);
}

function adjustNumber(val) {
  return (val < 10) ? val : (val - 9);
}

/**
 * @param { string } usim
 */
function usimToIccid(usim) {
  const mode = usim.slice(0, 5);
  const serial = usim.slice(-6).padStart(7, '0');

  const code = mode.charCodeAt(0).toString(10);

  const num = 10 - ((
    32 + sliceNumber(code, 0, 1) + adjustNumber(sliceNumber(code, -1) * 2)
    + sliceNumber(mode, 1, 2) + adjustNumber(sliceNumber(mode, 2, 3) * 2)
    + sliceNumber(mode, 3, 4)
    + adjustNumber(sliceNumber(serial, 0, 1) * 2) + sliceNumber(serial, 1, 2)
    + adjustNumber(sliceNumber(serial, 2, 3) * 2) + sliceNumber(serial, 3, 4)
    + adjustNumber(sliceNumber(serial, 4, 5) * 2) + sliceNumber(serial, 5, 6)
    + adjustNumber(sliceNumber(serial, 6, 7) * 2)
  ) % 10);

  return `898206${code}${mode.slice(1, 4)}${serial}${num}F`;
}

module.exports.deviceEntityIdByCtn = deviceEntityIdByCtn;
module.exports.usimToIccid = usimToIccid;
