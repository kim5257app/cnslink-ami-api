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
};
