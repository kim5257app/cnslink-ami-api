/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */

module.exports = {
  addUserInfo: (args) => ({
    sql: "INSERT INTO users(id) VALUES (:id)",
    args,
  }),
  getUserInfo: (args) => ({
    sql:
      "SELECT\n" +
      "  users.id, users.`name`,\n" +
      "  user_permission.admin, user_permission.manager\n" +
      "FROM users\n" +
      "JOIN user_permission ON user_permission.id=users.id\n" +
      "WHERE users.id=:id",
    args,
    done: (result) => ((result.length > 0) ? {
      ...result[0],
      admin: (result[0].admin > 0),
      manager: (result[0].manager > 0),
    } : null),
  }),
  updateUserName: (args) => ({
    sql:
      "UPDATE users\n" +
      "SET `name`=:name\n" +
      "WHERE id=:id",
    args,
  }),
};
