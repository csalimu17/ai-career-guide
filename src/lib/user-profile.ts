import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";

type UpsertUserProfileInput = {
  db: Firestore;
  uid: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  photoURL?: string | null;
  emailVerified?: boolean;
};

export async function upsertUserProfile({
  db,
  uid,
  email,
  firstName = "",
  lastName = "",
  photoURL,
  emailVerified = false,
}: UpsertUserProfileInput) {
  const userRef = doc(db, "users", uid);
  const existingProfile = await getDoc(userRef);
  const existingData = existingProfile.exists() ? existingProfile.data() : null;

  await setDoc(
    userRef,
    {
      id: uid,
      email: email || "",
      firstName,
      lastName,
      photoURL: photoURL || "",
      verified: emailVerified,
      suspended: existingData?.suspended ?? false,
      onboardingComplete: existingData?.onboardingComplete ?? false,
      plan: existingData?.plan ?? "free",
      usage: existingData?.usage ?? { aiGenerations: 0, atsChecks: 0 },
      createdAt: existingData?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
