import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from "firebase/firestore"
import { BILLING_PLANS } from "@/lib/plans"

const BILLING_PLAN_LOOKUP = Object.fromEntries(BILLING_PLANS.map((plan) => [plan.id, plan]))

function parseBillingPrice(price: string) {
  const parsed = Number.parseFloat(price.replace(/[^\d.]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * ContentService
 * Handles versioned landing page content management.
 */
export const ContentService = {
  async getPage(db: Firestore, slug: string) {
    const docRef = doc(db, "contentPages", slug)
    const snap = await getDoc(docRef)
    return snap.exists() ? snap.data() : null
  },

  async saveDraft(db: Firestore, slug: string, data: any, adminUid: string) {
    const docRef = doc(db, "contentPages", slug)
    await setDoc(docRef, {
      ...data,
      status: "draft",
      updatedBy: adminUid,
      updatedAt: serverTimestamp()
    }, { merge: true })
  },

  async publish(db: Firestore, slug: string, adminUid: string) {
    const docRef = doc(db, "contentPages", slug)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error("Page not found")

    const pageData = snap.data()
    
    // 1. Create a version snapshot
    const versionsRef = collection(db, "contentVersions")
    const lastVersionQuery = query(
      versionsRef, 
      where("slug", "==", slug), 
      orderBy("versionNumber", "desc"), 
      limit(1)
    )
    const lastVersionSnap = await getDocs(lastVersionQuery)
    const nextVersion = lastVersionSnap.empty ? 1 : lastVersionSnap.docs[0].data().versionNumber + 1

    await addDoc(versionsRef, {
      slug,
      versionNumber: nextVersion,
      snapshot: pageData,
      savedBy: adminUid,
      createdAt: serverTimestamp()
    })

    // 2. Set status to published
    await setDoc(docRef, {
      status: "published",
      updatedBy: adminUid,
      updatedAt: serverTimestamp()
    }, { merge: true })
  }
}

/**
 * Plan Migration Utility
 * Seeds Firestore planConfigs from the existing hardcoded PLAN_CONFIGS.
 */
export async function seedPlanConfigs(db: Firestore, planConfigs: any, adminUid: string) {
  const aiCreditMap: Record<string, number> = {
    free: 5,
    pro: 50,
    master: 1000,
  }

  for (const [planId, limits] of Object.entries(planConfigs)) {
    const docRef = doc(db, "planConfigs", planId)
    const billingPlan = BILLING_PLAN_LOOKUP[planId]
    const displayName = billingPlan?.name || (planId.charAt(0).toUpperCase() + planId.slice(1))
    
    await setDoc(docRef, {
      planId,
      displayName,
      isVisible: true,
      recommended: billingPlan?.highlight ?? planId === "pro",
      monthlyPriceDisplay: billingPlan ? parseBillingPrice(billingPlan.price) : 0,
      currencyCode: "GBP",
      stripePriceId: billingPlan?.stripePriceId ?? null,
      limits: {
        maxResumes: (limits as any).maxResumes,
        atsChecks: (limits as any).atsChecks,
        aiGenerations: (limits as any).aiGenerations,
      },
      access: {
        premiumTemplates: (limits as any).premiumTemplates,
        jobTracker: (limits as any).jobTracker, 
        advancedEditor: true,
        interviewPrep: planId !== "free",
        coverLetters: (limits as any).coverLetters > 0
      },
      updatedBy: adminUid,
      updatedAt: serverTimestamp()
    })
    
    // Log audit for manual seed
    await setDoc(doc(collection(db, "adminAuditLogs")), {
      action: "PLAN_CONFIG_SEEDED",
      description: `Seeded plan configuration for ${displayName}`,
      metadata: { planId, adminUid },
      createdAt: serverTimestamp()
    })
  }
}
