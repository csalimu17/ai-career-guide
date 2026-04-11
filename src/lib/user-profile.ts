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

type MinimalUserProfile = {
  onboardingComplete?: boolean;
  careerGoal?: string;
  experienceLevel?: string;
  industry?: string;
  targetRoles?: string;
  yearsOfExperience?: string;
  employmentStatus?: string;
} | null | undefined;

/**
 * Determines if a user should be directed to the dashboard.
 * Returning members are those who have either:
 * 1. Explicitly finished the onboarding flow.
 * 2. Provided enough profile data to have a personalized experience.
 * 3. Already have existing workspace data (resumes).
 */
export function isReturningMember(profile: MinimalUserProfile, hasWorkspaceData = false) {
  if (!profile) {
    return hasWorkspaceData;
  }

  // Authoritative "done" flag
  if (profile.onboardingComplete) {
    return true;
  }

  const hasOnboardingAnswers = Boolean(
    profile.careerGoal ||
      profile.experienceLevel ||
      profile.industry ||
      profile.targetRoles ||
      profile.yearsOfExperience ||
      profile.employmentStatus
  );

  // If they have data OR answers, they can technically use the dashboard.
  // However, the layout should decide whether to force-redirect them AWAY from onboarding.
  return hasOnboardingAnswers || hasWorkspaceData;
}

export function getPostAuthDestination(profile: MinimalUserProfile, hasWorkspaceData = false) {
  return isReturningMember(profile, hasWorkspaceData) ? "/dashboard" : "/onboarding";
}
