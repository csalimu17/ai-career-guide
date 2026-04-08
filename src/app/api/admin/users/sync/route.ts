import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { auth as adminAuth, db } from "@/firebase/admin";

type AdminRecord = {
  isActive?: boolean;
  roleIds?: string[];
  permissionOverrides?: string[];
  email?: string;
};

function hasUsersAccess(adminRecord: AdminRecord | undefined) {
  if (!adminRecord?.isActive) return false;

  const roles = new Set(adminRecord.roleIds || []);
  if (roles.has("super-admin") || roles.has("admin") || roles.has("support-manager")) {
    return true;
  }

  const overrides = new Set(adminRecord.permissionOverrides || []);
  return overrides.has("users.read") || overrides.has("users.update");
}

function splitName(displayName?: string | null) {
  if (!displayName) {
    return { firstName: "", lastName: "" };
  }

  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const idToken = authorization.slice("Bearer ".length).trim();
    if (!idToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminRef = db.collection("adminUsers").doc(decodedToken.uid);
    const adminSnapshot = await adminRef.get();
    const adminRecord = adminSnapshot.data() as AdminRecord | undefined;

    if (!hasUsersAccess(adminRecord)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let nextPageToken: string | undefined;
    let createdCount = 0;
    let updatedCount = 0;
    let inspectedCount = 0;
    const writer = db.bulkWriter();

    do {
      const page = await adminAuth.listUsers(1000, nextPageToken);
      nextPageToken = page.pageToken;

      const existingSnapshots = await db.getAll(
        ...page.users.map((userRecord) => db.collection("users").doc(userRecord.uid))
      );
      const existingById = new Map(existingSnapshots.map((snapshot) => [snapshot.id, snapshot]));

      for (const userRecord of page.users) {
        inspectedCount += 1;

        const userRef = db.collection("users").doc(userRecord.uid);
        const existingSnapshot = existingById.get(userRecord.uid);
        const { firstName, lastName } = splitName(userRecord.displayName);
        const createdAt = userRecord.metadata.creationTime
          ? admin.firestore.Timestamp.fromDate(new Date(userRecord.metadata.creationTime))
          : admin.firestore.FieldValue.serverTimestamp();

        if (!existingSnapshot?.exists) {
          createdCount += 1;
          writer.set(
            userRef,
            {
              id: userRecord.uid,
              email: userRecord.email || "",
              firstName,
              lastName,
              photoURL: userRecord.photoURL || "",
              verified: userRecord.emailVerified || false,
              suspended: userRecord.disabled || false,
              onboardingComplete: false,
              plan: "free",
              usage: { aiGenerations: 0, atsChecks: 0 },
              createdAt,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              syncedFromAuthAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          continue;
        }

        const current = existingSnapshot.data() || {};
        const patch: Record<string, unknown> = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          syncedFromAuthAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        let changed = false;

        if (!current.email && userRecord.email) {
          patch.email = userRecord.email;
          changed = true;
        }
        if (!current.firstName && firstName) {
          patch.firstName = firstName;
          changed = true;
        }
        if (!current.lastName && lastName) {
          patch.lastName = lastName;
          changed = true;
        }
        if (!current.photoURL && userRecord.photoURL) {
          patch.photoURL = userRecord.photoURL;
          changed = true;
        }
        if (current.verified === undefined) {
          patch.verified = userRecord.emailVerified || false;
          changed = true;
        }
        if (current.suspended === undefined) {
          patch.suspended = userRecord.disabled || false;
          changed = true;
        }
        if (!current.id) {
          patch.id = userRecord.uid;
          changed = true;
        }
        if (!current.plan) {
          patch.plan = "free";
          changed = true;
        }
        if (!current.usage) {
          patch.usage = { aiGenerations: 0, atsChecks: 0 };
          changed = true;
        }

        if (changed) {
          updatedCount += 1;
          writer.set(userRef, patch, { merge: true });
        }
      }
    } while (nextPageToken);

    await writer.close();

    await db.collection("adminAuditLogs").add({
      actorUid: decodedToken.uid,
      actorEmail: decodedToken.email || adminRecord?.email || "unknown",
      action: "USERS_SYNCED_FROM_AUTH",
      targetType: "USER_COLLECTION",
      targetId: "users",
      reason: "Manual governance sync",
      newValue: {
        inspectedCount,
        createdCount,
        updatedCount,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      inspectedCount,
      createdCount,
      updatedCount,
    });
  } catch (error) {
    console.error("[AdminUserSync] Failed to sync users:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown sync failure",
      },
      { status: 500 }
    );
  }
}
