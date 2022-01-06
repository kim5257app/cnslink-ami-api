const app = require('./firebase');

const auth = app.auth();

module.exports.verifyIdToken = async (token) => auth.verifyIdToken(token);
