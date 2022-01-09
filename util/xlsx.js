const XLSX = require('sheetjs-style');

async function exportProducts(items) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(items.map((item) => ({
    model: item.model,
    serial: item.serial,
    firmware: item.firmware,
    nbiotModel: item.nbiotModel,
    nbiotIMEI: item.nbiotIMEI,
    nbiotSerial: item.nbiotSerial,
    nbiotFirmware: item.nbiotFirmware,
    usim: item.usim,
  })));

  XLSX.utils.book_append_sheet(book, sheet, 'LIST');

  return XLSX.write(book, {
    type: 'buffer',
  });
}

module.exports.exportProducts = exportProducts;
