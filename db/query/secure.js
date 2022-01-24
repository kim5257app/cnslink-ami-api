/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */

const Error = require('../../debug/error');

const fields = {
  model: 'products.model',
  serial: 'products.serial',
  iccid: 'products.iccid',
  ctn: 'products.ctn',
  entityId: 'entity_id',
  serviceCode: 'products.service_code',
  timestamp: 'secure_apply.timestamp',
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
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter))).join('\n')}` : '';

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
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter))).join('\n')}` : '';

      const order = transSortToSql(args);

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
};
