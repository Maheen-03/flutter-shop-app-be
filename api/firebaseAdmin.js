const admin = require("firebase-admin");

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error("Missing FIREBASE_PRIVATE_KEY — Firebase not initialized");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
}

module.exports = admin;
