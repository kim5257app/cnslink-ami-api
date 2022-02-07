const XLSX = require('sheetjs-style');

async function exportProducts(items) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(items.map((item) => ({
    serviceCode: item.serviceCode,
    model: item.model,
    serial: item.serial,
    firmware: item.firmware,
    nbiotModel: item.nbiotModel,
    nbiotIMEI: item.nbiotIMEI,
    nbiotSerial: item.nbiotSerial,
    nbiotFirmware: item.nbiotFirmware,
    usim: item.usim,
    ctn: item.ctn,
  })));

  XLSX.utils.book_append_sheet(book, sheet, 'LIST');

  return XLSX.write(book, { type: 'buffer' });
}

async function exportStatus(items) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(items.map((item) => ({
    model: item.model,
    serial: item.serial,
    ctn: item.ctn,
    ssimFailure: item.ssimFailure,
    ssimExist: item.ssimExist,
    gasLeak: item.gasLeak,
    gasLowPressure: item.gasLowPressure,
    lowPower: item.lowPower,
    gasOverflow: item.gasOverflow,
    gasUnused: item.gasUnused,
    gasBackflow: item.gasBackflow,
    errorState3: item.errorState3,
    errorState2: item.errorState2,
    errorState1: item.errorState1,
    errorState0: item.errorState0,
    kmsState: item.kmsState,
    count: item.count,
    timestamp: item.timestamp,
  })));

  XLSX.utils.book_append_sheet(book, sheet, 'LIST');

  return XLSX.write(book, { type: 'buffer' });
}

async function exportSecurePlatform(items) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(items.map((item) => ({
    model: item.model,
    serial: item.serial,
    ctn: item.ctn,
    iccid: item.iccid,
    entityId: item.entityId,
    aei: item.aei,
    status: item.status,
    timestamp: item.timestamp,
  })));

  XLSX.utils.book_append_sheet(book, sheet, 'LIST');

  return XLSX.write(book, { type: 'buffer' });
}

async function exportSecureStatus(items) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(items.map((item) => ({
    model: item.model,
    serial: item.serial,
    checkTime: item.checkTime,
    flowTotal: item.flowTotal,
    lowMainBattery: item.lowMainBattery,
    rssi: item.rssi,
    reversedPulse: item.reversedPulse,
    timestamp: item.timestamp,
  })));

  XLSX.utils.book_append_sheet(book, sheet, 'LIST');

  return XLSX.write(book, { type: 'buffer' });
}

async function importProductsWithCtn(buffer) {
  const book = XLSX.read(buffer, { type: 'buffer' });
  const sheet = book.Sheets[book.SheetNames[0]];

  const items = XLSX.utils.sheet_to_json(sheet);

  console.log('importProductsWithCtn:', JSON.stringify(items));
}

module.exports.exportProducts = exportProducts;
module.exports.exportStatus = exportStatus;
module.exports.exportSecurePlatform = exportSecurePlatform;
module.exports.exportSecureStatus = exportSecureStatus;
module.exports.importProductsWithCtn = importProductsWithCtn;
