/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */

const Error = require('../../debug/error');

const fields = {
  nbiotModel: 'nbiot_model',
  nbiotSerial: 'nbiot_serial',
  nbiotFirmware: 'nbiot_firmware',
  nbiotIMEI: 'nbiot_imei',
  nbiotRSRP: 'nbiot_rsrp',
  nbiotRSRQ: 'nbiot_rsrq',
  nbiotRSSI: 'nbiot_rssi',
  nbiotTxPower: 'nbiot_tx_power',
  serviceCode: 'service_code',
};

const condTables = {
  inc: 'LIKE (?)',
  eq: '=?',
  ne: '!=?',
  gt: '>?',
  ge: '>=?',
  lt: '<?',
  le: '<=?',
  none: 'IS NULL',
};

function transFilterToSql(filter) {
  const operator = (filter.where === 'and' || filter.where === 'or')
    ? filter.where.toUpperCase() : '';
  const column = (fields[filter.column] != null)
    ? fields[filter.column] : filter.column;
  const condition = condTables[filter.condition];

  if (condition == null) {
    Error.throwFail('WRONG_ARGUMENT', 'Wring filters');
  }

  return `${operator} ${column} ${condition}`;
}

function transSortToSql({ sortBy, sortDesc }) {
  let order = '';

  if (sortBy.length > 0) {
    order = 'ORDER BY ' +
      sortBy.map((item, idx) => ({
        field: (fields[item] != null) ? fields[item] : item,
        desc: sortDesc[idx] ? 'DESC' : 'ASC',
      })).map(({ field, desc }) => (
        `${field} ${desc}`
      )).join();
  }

  return order;
}

module.exports = {
  insertProduction: (args) => ({
    sql:
      "INSERT INTO products(\n" +
      "  model, `serial`, firmware,\n" +
      "  nbiot_model, nbiot_serial, nbiot_firmware, nbiot_imei,\n" +
      "  nbiot_rsrp, nbiot_rsrq, nbiot_rssi, nbiot_tx_power,\n" +
      "  usim, ssim,\n" +
      "  result, memo\n" +
      ")\n" +
      "VALUES (\n" +
      "  :model, :serial, :firmware,\n" +
      "  :nbiotModel, :nbiotSerial, :nbiotFirmware, :nbiotIMEI,\n" +
      "  :nbiotRSRP, :nbiotRSRQ, :nbiotRSSI, :nbiotTxPower,\n" +
      "  :usim, :ssim,\n" +
      "  :result, :memo \n" +
      ")",
    args,
  }),
  checkDuplicate: (args) => ({
    sql:
      "SELECT\n" +
      "  COUNT(CASE WHEN (model=:model AND `serial`=:serial) THEN 1 END) AS dupSerial,\n" +
      "  COUNT(CASE WHEN (nbiot_model=:nbiotModel AND nbiot_serial=:nbiotSerial) THEN 1 END) AS dupNbiotSerial,\n" +
      "  COUNT(CASE WHEN `nbiot_imei`=:nbiotIMEI THEN 1 END) AS dupNbiotIMEI,\n" +
      "  COUNT(CASE WHEN `usim`=:usim THEN 1 END) AS dupUsim\n" +
      "FROM products\n" +
      "WHERE\n" +
      "  (model=:model AND `serial`=:serial)\n" +
      "  OR (nbiot_model=:nbiotModel AND nbiot_serial=:nbiotSerial)\n" +
      "  OR nbiot_imei=:nbiotIMEI\n" +
      "  OR usim=:usim",
    args,
    done: (result) => ({
      dupSerial: (result[0].dupSerial > 0),
      dupNbiotSerial: (result[0].dupNbiotSerial > 0),
      dupNbiotIMEI: (result[0].dupNbiotIMEI > 0),
      dupUsim: (result[0].dupUsim > 0),
    }),
  }),
  summaryProducts: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter))).join('\n')}` : '';

      const sel =
        "SELECT COUNT(*) AS `count`\n" +
        "FROM products\n";

      return `${sel}${where}`;
    })(),
    args: args.filters
      .filter((arg) => (arg.condition !== 'none'))
      .map((arg) => ((arg.condition === 'inc') ? `%${arg.value}%` : arg.value)),
    done: (result) => (result[0]),
  }),
  getProducts: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter))).join('\n')}` : '';

      const order = transSortToSql(args);

      const sel =
        "SELECT\n" +
        "  products.model, products.`serial`,\n" +
        "  firmware,\n" +
        "  nbiot_model AS nbiotModel,\n" +
        "  nbiot_serial AS nbiotSerial,\n" +
        "  nbiot_firmware AS nbiotFirmware,\n" +
        "  nbiot_imei AS nbiotIMEI,\n" +
        "  nbiot_rsrp AS nbiotRSRP,\n" +
        "  nbiot_rsrq AS nbiotRSRQ,\n" +
        "  nbiot_rssi AS nbiotRSSI,\n" +
        "  nbiot_tx_power AS nbiotTxPower,\n" +
        "  usim, iccid, ssim, ctn, result, memo,\n" +
        "  service_code AS serviceCode,\n" +
        "  `timestamp`\n" +
        "FROM products\n";

      const offset = "\nLIMIT ?, ?";

      const lookup =
        "JOIN\n" +
        "  (SELECT model, `serial`\n" +
        "  FROM products\n" +
        where +
        order +
        ((args.itemsPerPage > 0) ? offset : "") +
        "  ) AS lookup\n" +
        "ON products.model=lookup.model AND products.`serial`=lookup.`serial`";

      return `${sel}${lookup}${order}`;
    })(),
    args: [
      ...args.filters
        .filter((arg) => (arg.condition !== 'none'))
        .map((arg) => ((arg.condition === 'inc') ? `%${arg.value}%` : arg.value)),
      ...((args.itemsPerPage > 0) ? [
        (args.page - 1) * args.itemsPerPage,
        args.itemsPerPage,
      ] : []),
    ],
  }),
  updateCtn: (args) => ({
    batch: true,
    sql:
      "UPDATE products\n" +
      "SET ctn=:ctn\n" +
      "WHERE model=:model AND `serial`=:serial",
    args,
  }),
  updateIccid: (args) => ({
    batch: true,
    sql:
      "UPDATE products\n" +
      "SET iccid=:iccid\n" +
      "WHERE model=:model AND `serial`=:serial",
    args,
  }),
};
