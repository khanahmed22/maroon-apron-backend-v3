import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Generate: Firebase Console > Project Settings > Service Accounts >
// Generate new private key (downloads a JSON file). Then base64-encode
// the whole file's contents into a single line — this avoids the .env
// newline/quoting issues that raw multi-line JSON runs into:
//
//   Windows (PowerShell):
//     [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\file.json"))
//
// Paste that single long string as FIREBASE_SERVICE_ACCOUNT_BASE64 in your
// .env (and in your host's env vars, e.g. Render). Never commit the raw
// JSON file to git.

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8"),
);

const app = getApps().length ? getApps()[0] : initializeApp({
  credential: cert(serviceAccount),
});

export const messaging = getMessaging(app);