/* eslint quotes: ["off"] */
/* eslint operator-linebreak: ["off"] */
/* eslint prefer-template: ["off"] */

module.exports = {
  addUserInfo: (args) => ({
    sql: "INSERT INTO users(id, email) VALUES (:id, :email)",
    args,
  }),
  getUserInfo: (args) => ({
    sql:
      "SELECT\n" +
      "  users.id, users.`name`, users.email,\n" +
      "  user_permission.admin,\n" +
      "  user_permission.manager,\n" +
      "  user_permission.lookup\n" +
      "FROM users\n" +
      "JOIN user_permission ON user_permission.id=users.id\n" +
      "WHERE users.id=:id",
    args,
    done: (result) => ((result.length > 0) ? {
      ...result[0],
      admin: (result[0].admin > 0),
      manager: (result[0].manager > 0),
      lookup: (result[0].lookup > 0),
    } : null),
  }),
  updateUserName: (args) => ({
    sql:
      "UPDATE users\n" +
      "SET `name`=:name\n" +
      "WHERE id=:id",
    args,
  }),
  updatePermission: (args) => ({
    sql:
      "UPDATE user_permission\n" +
      "SET manager=:manager, lookup=:lookup\n" +
      "WHERE id=:id",
    args: {
      id: args.id,
      admin: (args.admin ? 1 : 0),
      manager: (args.manager ? 1 : 0),
      lookup: (args.lookup ? 1 : 0),
    },
  }),
  getUserList: (args) => ({
    sql:
      "SELECT users.id, email, `name`, admin, manager, lookup\n" +
      "FROM users\n" +
      "JOIN user_permission ON users.id=user_permission.id\n" +
      "WHERE admin=0",
    args,
  }),
};
