const admin = require("firebase-admin");

const serviceAccount = require('../../boindo-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

module.exports = messaging;