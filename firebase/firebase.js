const admin = require('firebase-admin');

const serviceAccount = require('../config/firebase.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default app;
