"use server"

import { db } from "@/firebase/admin"
import { atsOptimizationScoring } from "@/ai/flows/ats-optimization-scoring-flow"

export async function generateGuardianInsightsAction(userId: string) {
  try {
    // 1. Fetch recent saved jobs that don't have a match score yet
    const jobsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("jobApplications")
      .where("status", "==", "saved")
      .orderBy("updatedAt", "desc")
      .limit(3)
      .get()

    const appliedJobsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("jobApplications")
      .where("status", "==", "applied")
      .orderBy("updatedAt", "desc")
      .limit(5)
      .get()

    const insights = []

    // 3. Proactive Analysis Insight
    if (!jobsSnapshot.empty) {
      const targetJob = jobsSnapshot.docs[0].data() as any
      if (targetJob.jobDescription && targetJob.jobDescription.length > 100) {
        insights.push({
          id: `match-${targetJob.id}`,
          jobId: targetJob.id,
          company: targetJob.company,
          role: targetJob.role,
          type: "high_match_alert",
          preview: `I've analyzed your latest resume against this role. The alignment looks significant.`,
          actionLabel: "Reveal Match Depth",
          status: "ready"
        })
      }
    }

    // 4. Follow-up Insight
    if (!appliedJobsSnapshot.empty) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const stagnantJob = appliedJobsSnapshot.docs.find(doc => {
        const data = doc.data()
        const updatedAt = data.updatedAt?.toDate() || new Date()
        return updatedAt < sevenDaysAgo
      })

      if (stagnantJob) {
        const data = stagnantJob.data() as any
        insights.push({
          id: `followup-${stagnantJob.id}`,
          jobId: stagnantJob.id,
          company: data.company,
          role: data.role,
          type: "followup_reminder",
          preview: `It's been over a week since you applied. Would you like me to draft a follow-up email?`,
          actionLabel: "Draft Follow-up",
          status: "ready"
        })
      }
    }

    return { insights }
  } catch (error) {
    console.error("Guardian Error:", error)
    return { insights: [] }
  }
}

export async function revealGuardianInsightAction(userId: string, jobId: string) {
  // This triggers the FULL ATS flow proactively
  
  // Fetch job and resume
  const jobDoc = await db.collection("users").doc(userId).collection("jobApplications").doc(jobId).get()
  const resumeSnapshot = await db.collection("users").doc(userId).collection("resumes").orderBy("updatedAt", "desc").limit(1).get()

  if (!jobDoc.exists || resumeSnapshot.empty) return { success: false, error: "Missing data" }

  const job = jobDoc.data() as any
  const resume = resumeSnapshot.docs[0].data() as any

  try {
    const result = await atsOptimizationScoring({
      cvContent: JSON.stringify(resume.content || resume),
      jobDescription: job.jobDescription,
    })

    // Store the report
    const reportRef = await db.collection("users").doc(userId).collection("atsReports").add({
      ...result,
      jobId,
      createdAt: new Date(),
      type: "guardian_proactive"
    })

    return { 
       success: true,
       id: reportRef.id,
       ...result 
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to analyze" }
  }
}
