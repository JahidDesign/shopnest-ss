// firebase.js
// firebase.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

// 🔑 Parse Firebase service account from ENV
// In Render, set FIREBASE_CONFIG as the full JSON string
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
