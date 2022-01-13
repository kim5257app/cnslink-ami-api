/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */
const Error = require('../../debug/error');

const fields = {
  ctn: 'ctn',
  ssimFailure: 'ctn',
  ssimExist: 'ctn',
  gasLeak: 'ctn',
  gasLowPressure: 'ctn',
  lowPower: 'ctn',
  gasOverflow: 'ctn',
  gasUnused: 'ctn',
  gasBackflow: 'ctn',
  errorState3: 'ctn',
  errorState2: 'ctn',
  errorState1: 'ctn',
  errorState0: 'ctn',
  kmsState: 'ctn',
  count: 'ctn',
  timestamp: 'ctn',
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
  const operator = (filter.operator === 'and' || filter.operator === 'or')
    ? filter.operator.toUpperCase() : '';
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
  summaryStatus: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter)))}` : '';

      const sel =
        "SELECT COUNT(*) AS `count`\n" +
        "FROM recent_products_status\n";

      return `${sel}${where}`;
    })(),
    args: args.filters
      .filter((arg) => (arg.condition !== 'none'))
      .map((arg) => ((arg.condition === 'inc') ? `%${arg.value}%` : arg.value)),
    done: (result) => (result[0]),
  }),
  getStatus: (args) => ({
    sql: (() => {
      const where = (args.filters.length > 0)
        ? `WHERE ${args.filters.map((filter) => (transFilterToSql(filter)))}` : '';

      const order = transSortToSql(args);

      const sel =
        "SELECT\n" +
        "model, serial, recent_products_status.ctn,\n" +
        "ssim_failure AS ssimFailure, ssim_exist AS ssimExist,\n" +
        "gas_leak AS gasLeak, gas_low_pressure AS gasLowPressure, low_power AS lowPower,\n" +
        "gas_overflow AS gasOverflow, gas_unused AS gasUnused, gas_backflow AS gasBackflow,\n" +
        "error_state3 AS errorState3, error_state2 AS errorState2,\n" +
        "error_state1 AS errorState1, error_state0 AS errorState0,\n" +
        "kms_state AS kmsState,\n" +
        "count, timestamp\n" +
        "FROM recent_products_status\n";

      const offset = "\nLIMIT ?, ?";

      const lookup =
        "JOIN\n" +
        "  (SELECT ctn FROM recent_products_status\n" +
        where +
        order +
        offset +
        "  ) AS lookup\n" +
        "ON recent_products_status.ctn=lookup.ctn\n";

      return `${sel}${lookup}${order}`;
    })(),
    args: [
      ...args.filters
        .filter((arg) => (arg.condition !== 'none'))
        .map((arg) => ((arg.condition === 'inc') ? `%${arg.value}%` : arg.value)),
      (args.page - 1) * args.itemsPerPage,
      args.itemsPerPage,
    ],
  }),
};
