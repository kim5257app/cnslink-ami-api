const { getAuth } = require('firebase-admin/lib/auth');
const app = require('./firebase');

const auth = getAuth(app);

module.exports.verifyIdToken = async (token) => auth.verifyIdToken(token);
