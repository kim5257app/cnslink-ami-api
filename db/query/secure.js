/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */

const Error = require('../../debug/error');

const secureFields = {
  model: 'products.model',
  serial: 'products.serial',
  iccid: 'products.iccid',
  ctn: 'products.ctn',
  entityId: 'entity_id',
  serviceCode: 'products.service_code',
  timestamp: 'secure_apply.timestamp',
  checkTime: 'check_time',
  lowMainBattery: 'low_main_battery',
  reversedPulse: 'reversed_pulse',
};

const statusFields = {
  model: 'recent_secure_products_status.model',
  serial: 'recent_secure_products_status.serial',
  iccid: 'recent_secure_products_status.iccid',
  ctn: 'recent_secure_products_status.ctn',
  timestamp: 'recent_secure_products_status.timestamp',
  checkTime: 'check_time',
  lowMainBattery: 'low_main_battery',
  reversedPulse: 'reversed_pulse',
  flowTotal: 'flow_total',
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

function transFilterToSql(filter, fields) {
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

function transSortToSql({ sortBy, sortDesc }, fields) {
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
  applySecure: (args) => ({
    batch: true,
    sql:
      "INSERT INTO secure_apply(iccid, ctn, entity_id)\n" +
      "VALUES (:iccid, :ctn, :entityId)",
    args,
  }),
  releaseSecure: (args) => ({
    batch: true,
    sql:
      "UPDATE secure_apply\n" +
      "SET `status`=4\n" +
      "WHERE ctn=:ctn AND iccid=:iccid",
    args,
  }),
  removeSecure: (args) => ({
    sql:
      "DELETE FROM secure_apply\n" +
      "WHERE ctn=:ctn AND iccid=:iccid",
    args,
  }),
  updateInfo: (args) => ({
    sql:
      "UPDATE secure_apply\n" +
      "SET aei=:aei, `status`=:status\n" +
      "WHERE ctn=:ctn AND iccid=:iccid",
    args,
  }),
  getSecureProcessListCount: (args) => ({
    sql:
      "SELECT\n" +
      "  COUNT(*) AS `count`\n" +
      "FROM secure_apply\n" +
      "JOIN products ON\n" +
      "  products.iccid=secure_apply.iccid\n" +
      "  AND products.ctn=secure_apply.ctn\n" +
      "WHERE\n" +
      "  `status` IN (0, 1, 4, 5)",
    args,
  }),
  getSecureProcessList: (args) => ({
    sql:
      "SELECT\n" +
      "  secure_apply.iccid,\n" +
      "  secure_apply.ctn,\n" +
      "  entity_id AS entityId,\n" +
      "  aei,\n" +
      "  service_code AS serviceCode,\n" +
      "  `status`\n" +
      "FROM secure_apply\n" +
      "JOIN products ON\n" +
      "  products.iccid=secure_apply.iccid\n" +
      "  AND products.ctn=secure_apply.ctn\n" +
      "WHERE\n" +
      "  `status` IN (0, 1, 4, 5)\n" +
      "ORDER BY `status` DESC\n" +
      "LIMIT 100",
    args,
  }),
  summarySecureApply: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter, secureFields))).join('\n')}` : '';

      const sel =
        "SELECT COUNT(*) AS `count`\n" +
        "FROM secure_apply\n" +
        "JOIN products ON\n" +
        "  products.iccid=secure_apply.iccid\n" +
        "  AND products.ctn=secure_apply.ctn\n";

      return `${sel}${where}`;
    })(),
    args: args.filters
      .filter((arg) => (arg.condition !== 'none'))
      .map((arg) => ((arg.condition === 'inc') ? `%${arg.value}%` : arg.value)),
    done: (result) => (result[0]),
  }),
  getSecureApply: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter, secureFields))).join('\n')}` : '';

      const order = transSortToSql(args, secureFields);

      const sel =
        "SELECT\n" +
        "  products.model, products.`serial`,\n" +
        "  usim, products.iccid, products.ctn,\n" +
        "  service_code AS serviceCode,\n" +
        "  entity_id AS entityId,\n" +
        "  aei, status, secure_apply.`timestamp`\n" +
        "FROM secure_apply\n" +
        "JOIN products ON\n" +
        "  products.iccid=secure_apply.iccid\n" +
        "  AND products.ctn=secure_apply.ctn\n";

      const offset = "\nLIMIT ?, ?";

      const lookup =
        "JOIN\n" +
        "  (SELECT model, `serial`\n" +
        "  FROM secure_apply\n" +
        "  JOIN products ON\n" +
        "    products.iccid=secure_apply.iccid\n" +
        "    AND products.ctn=secure_apply.ctn\n" +
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
  addSecureTask: (args) => ({
    batch: true,
    sql:
      "INSERT INTO secure_task_list(iccid, ctn, task)\n" +
      "VALUES (:iccid, :ctn, :task)",
    args: (() => (args.items.map((item) => ({
      ...item,
      task: args.task,
    }))))(),
  }),
  getSecureTaskList: (args) => ({
    sql:
      "SELECT\n" +
      "  `no`, secure_apply.iccid, secure_apply.ctn,\n" +
      "  entity_id AS entityId, aei,\n" +
      "  service_code AS serviceCode,\n" +
      "  task, secure_task_list.result,\n" +
      "  secure_task_list.timestamp, updated\n" +
      "FROM secure_task_list\n" +
      "JOIN secure_apply\n" +
      "ON secure_apply.iccid=secure_task_list.iccid\n" +
      "  AND secure_apply.ctn=secure_task_list.ctn\n" +
      "JOIN products\n" +
      "ON products.iccid=secure_task_list.iccid\n" +
      "  AND products.ctn=secure_task_list.ctn\n" +
      "WHERE secure_task_list.result=0",
    args,
  }),
  updateSecureTask: (args) => ({
    sql:
      "UPDATE secure_task_list\n" +
      "SET result=:result\n" +
      "WHERE `no`=:no",
    args,
  }),
  insertSecureStatus: (args) => ({
    sql:
      "INSERT INTO secure_status(iccid, ctn, check_time, flow_total, rssi, reversed_pulse, low_main_battery)\n" +
      "VALUES (:iccid, :ctn, :checkTime, :flowTotal, :rssi, :reversedPulse, :lowMainBattery)",
    args: {
      ...args,
      checkTime: (() => {
        const { checkTime } = args;
        const date = `${checkTime.slice(0, 4)}-${checkTime.slice(4, 6)}-${checkTime.slice(6, 8)}`;
        const time = `${checkTime.slice(9, 11)}:${checkTime.slice(11, 13)}:${checkTime.slice(13, 15)}`;
        return `${date} ${time}`;
      })(),
    },
  }),
  summarySecureStatus: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter, statusFields))).join('\n')}` : '';

      const sel =
        "SELECT COUNT(*) AS `count`\n" +
        "FROM recent_secure_products_status\n";

      return `${sel}${where}`;
    })(),
    args: args.filters
      .filter((arg) => (arg.condition !== 'none'))
      .map((arg) => ((arg.condition === 'inc') ? `%${arg.value}%` : arg.value)),
    done: (result) => (result[0]),
  }),
  getSecureStatus: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter, statusFields))).join('\n')}` : '';

      const order = transSortToSql(args, statusFields);

      const sel =
        "SELECT\n" +
        "  model, `serial`,\n" +
        "  recent_secure_products_status.ctn,\n" +
        "  recent_secure_products_status.iccid,\n" +
        "  check_time AS checkTime,\n" +
        "  flow_total AS flowTotal,\n" +
        "  rssi,\n" +
        "  reversed_pulse AS reversedPulse,\n" +
        "  low_main_battery AS lowMainBattery,\n" +
        "  timestamp\n" +
        "FROM recent_secure_products_status\n";

      const offset = "\nLIMIT ?, ?";

      const lookup =
        "JOIN\n" +
        "  (SELECT ctn, `iccid`\n" +
        "  FROM recent_secure_products_status\n" +
        where +
        order +
        ((args.itemsPerPage > 0) ? offset : "") +
        "  ) AS lookup\n" +
        "ON recent_secure_products_status.ctn=lookup.ctn\n" +
        "  AND recent_secure_products_status.iccid=lookup.iccid\n";

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
};
