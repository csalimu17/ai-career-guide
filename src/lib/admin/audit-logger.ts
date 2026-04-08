import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Firestore } from "firebase/firestore"

export interface AuditLogParams {
  actorUid: string
  actorEmail: string
  action: string
  targetType: string
  targetId: string
  oldValue?: any
  newValue?: any
  reason?: string
  metadata?: {
    ip?: string
    userAgent?: string
  }
}

/**
 * AuditLogger
 * Utility for writing immutable administrative activity logs to Firestore.
 */
export async function logAdminAction(db: Firestore, params: AuditLogParams) {
  try {
    const logsCollection = collection(db, "adminAuditLogs")
    await addDoc(logsCollection, {
      ...params,
      createdAt: serverTimestamp(),
    })
    console.log(`[Audit] ${params.action} logged for ${params.actorEmail}`)
  } catch (error) {
    console.error("Failed to write audit log:", error)
    // In production, you might want to send this to an external logging service
  }
}
