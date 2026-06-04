/**
 * Grant super-admin access by creating / updating the adminUsers/{uid}
 * Firestore document for a given user.
 *
 * Usage:
 *   npx tsx scripts/grant-super-admin.ts <uid-or-email>
 *
 * Examples:
 *   npx tsx scripts/grant-super-admin.ts csalimu178@gmail.com
 *   npx tsx scripts/grant-super-admin.ts abc123XYZdef456...
 *
 * Requires Firebase Admin credentials. The Admin SDK is initialized via
 * src/firebase/admin.ts, which reads FIREBASE_SERVICE_ACCOUNT_KEY from env
 * (or falls back to applicationDefault credentials).
 *
 * If you don't have FIREBASE_SERVICE_ACCOUNT_KEY locally:
 *   1. Firebase Console -> Project Settings -> Service Accounts -> Generate
 *      new private key. Save the JSON.
 *   2. Either:
 *      (a) export FIREBASE_SERVICE_ACCOUNT_KEY="$(cat /path/to/key.json)"
 *      (b) Or use gcloud: `gcloud auth application-default login` and the
 *          admin SDK will pick up your user creds.
 */

import "dotenv/config";

import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "../src/firebase/admin";

function isEmail(value: string) {
  return value.includes("@");
}

async function resolveUserRecord(input: string) {
  if (isEmail(input)) {
    return auth.getUserByEmail(input);
  }
  return auth.getUser(input);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "Usage: npx tsx scripts/grant-super-admin.ts <uid-or-email>\n" +
        "Examples:\n" +
        "  npx tsx scripts/grant-super-admin.ts csalimu178@gmail.com\n" +
        "  npx tsx scripts/grant-super-admin.ts abc123XYZdef456..."
    );
    process.exit(1);
  }

  console.log(`[grant-super-admin] Resolving Firebase Auth user for: ${arg}`);

  let userRecord;
  try {
    userRecord = await resolveUserRecord(arg);
  } catch (err: any) {
    console.error(
      `[grant-super-admin] Could not find a Firebase Auth user for "${arg}":`,
      err?.message || err
    );
    console.error(
      "If you passed a UID, double-check it. If you passed an email, make " +
        "sure the user has signed in at least once."
    );
    process.exit(2);
  }

  const uid = userRecord.uid;
  const email = userRecord.email ?? "";
  const displayName = userRecord.displayName ?? "";

  console.log(`[grant-super-admin] Target user:`);
  console.log(`  uid:         ${uid}`);
  console.log(`  email:       ${email || "(none on file)"}`);
  console.log(`  displayName: ${displayName || "(none on file)"}`);

  const adminRef = db.collection("adminUsers").doc(uid);
  const existing = await adminRef.get();

  if (existing.exists) {
    console.log(
      `[grant-super-admin] adminUsers/${uid} already exists. Current record:`
    );
    console.log(JSON.stringify(existing.data(), null, 2));
  } else {
    console.log(`[grant-super-admin] adminUsers/${uid} does not exist. Creating.`);
  }

  await adminRef.set(
    {
      uid,
      email,
      fullName: displayName,
      isActive: true,
      roleIds: ["super-admin"],
      permissionOverrides: [],
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: existing.exists
        ? existing.data()?.createdAt ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const after = await adminRef.get();
  console.log(`[grant-super-admin] Done. Record now reads:`);
  console.log(JSON.stringify(after.data(), null, 2));
  console.log(
    `\nNext: hard-refresh https://aicareerguide.uk/admin (Ctrl+Shift+R / Cmd+Shift+R).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[grant-super-admin] Unexpected failure:", err);
    process.exit(99);
  });
