/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */

module.exports = {
  applySecure: (args) => ({
    batch: true,
    sql:
      "INSERT INTO secure_apply(iccid, ctn, entity_id)\n" +
      "VALUES (:iccid, :ctn, :entityId)",
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
      "  `status` < 2\n" +
      "ORDER BY `status` DESC\n" +
      "LIMIT 100",
    args,
  }),
};
