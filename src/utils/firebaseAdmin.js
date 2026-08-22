import admin from "firebase-admin";

// TODO: point this at your actual service account credentials.
// Easiest options:
//   1. Download the service account JSON from Firebase Console >
//      Project Settings > Service Accounts > Generate new private key,
//      then load it here (keep it OUT of version control / .gitignore it).
//   2. Or store the JSON contents in an env var (e.g. FIREBASE_SERVICE_ACCOUNT)
//      and JSON.parse it, which is friendlier for Render/hosting envs
//      that don't support file uploads.

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;