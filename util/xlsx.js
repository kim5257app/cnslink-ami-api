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
    ctn: item.ctn,
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
module.exports.importProductsWithCtn = importProductsWithCtn;
