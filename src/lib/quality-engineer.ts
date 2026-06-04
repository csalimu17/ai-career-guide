import "server-only";

type QualitySignalStatus = "healthy" | "warning" | "critical";
type QualitySignalCategory = "upload" | "extraction" | "editor" | "print";

export type QualitySignalInput = {
  category: QualitySignalCategory;
  eventType: string;
  status: QualitySignalStatus;
  summary: string;
  detail?: string;
  userId?: string;
  resumeId?: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
};

type RecentSignal = {
  id: string;
  category: QualitySignalCategory;
  eventType: string;
  status: QualitySignalStatus;
  summary: string;
  createdAt: string | null;
};

type MonitorCheck = {
  id: string;
  title: string;
  status: QualitySignalStatus;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  autoFixes: string[];
};

type QualitySignalRecord = {
  id: string;
  category: QualitySignalCategory;
  eventType: string;
  status: QualitySignalStatus;
  summary: string;
  createdAt?: unknown;
};

export type QualityEngineerSnapshot = {
  generatedAt: string;
  overallStatus: QualitySignalStatus;
  checks: MonitorCheck[];
  recentSignals: RecentSignal[];
};

async function getCollections() {
  const [{ db }, firestoreAdmin] = await Promise.all([
    import("@/firebase/admin"),
    import("firebase-admin/firestore"),
  ]);

  return {
    db,
    FieldValue: firestoreAdmin.FieldValue,
  };
}

export async function recordQualitySignal(signal: QualitySignalInput) {
  try {
    const { db, FieldValue } = await getCollections();
    await db.collection("qualityEngineerEvents").add({
      ...signal,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[QualityEngineer] Failed to record quality signal:", error);
  }
}

function normalizeDate(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function chooseOverallStatus(statuses: QualitySignalStatus[]): QualitySignalStatus {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "healthy";
}

export async function getQualityEngineerSnapshot(): Promise<QualityEngineerSnapshot> {
  try {
    const { db } = await getCollections();

    const [jobSnapshot, signalSnapshot] = await Promise.all([
      db.collection("resumeExtractionJobs").orderBy("createdAt", "desc").limit(20).get(),
      db.collection("qualityEngineerEvents").orderBy("createdAt", "desc").limit(20).get(),
    ]);

    const jobs = jobSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<Record<string, any>>;
    const signals: QualitySignalRecord[] = signalSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    })) as QualitySignalRecord[];

    const extractionJobs = jobs.length;
    const reviewRequiredCount = jobs.filter((job) => job.status === "review_required").length;
    const failedSoftCount = jobs.filter((job) => job.status === "failed_soft").length;
    const recoveredCount = jobs.filter((job) => job.guardian?.status === "recovered").length;
    const multimodalCount = jobs.filter((job) => job.strategy === "multimodal").length;
    const averageConfidence =
      extractionJobs > 0
        ? jobs.reduce((sum, job) => sum + Number(job.confidence || 0), 0) / extractionJobs
        : 0;

    const uploadSignals = signals.filter((signal) => signal.category === "upload");
    const uploadWarnings = uploadSignals.filter((signal) => signal.status === "warning").length;
    const uploadCriticals = uploadSignals.filter((signal) => signal.status === "critical").length;
    const uploadStatus: QualitySignalStatus =
      uploadCriticals > 0 ? "critical" : uploadWarnings > 0 ? "warning" : "healthy";

    const extractionStatus: QualitySignalStatus =
      failedSoftCount > 0 ? "critical" : reviewRequiredCount > Math.max(2, Math.floor(extractionJobs * 0.4)) ? "warning" : "healthy";

    const printSignals = signals.filter((signal) => signal.category === "print");
    const editorSignals = signals.filter((signal) => signal.category === "editor");
    const layoutWarnings = printSignals.filter((signal) => signal.eventType === "print_layout_risk_detected").length;
    const layoutVerifications = printSignals.filter((signal) => signal.eventType === "print_layout_verified").length;
    const printWarnings = printSignals.filter((signal) => signal.status !== "healthy").length;
    const editorWarnings = editorSignals.filter((signal) => signal.status !== "healthy").length;

    const printStatus: QualitySignalStatus = printWarnings > 0 ? "warning" : "healthy";
    const editorStatus: QualitySignalStatus = editorWarnings > 0 ? "warning" : "healthy";

    const checks: MonitorCheck[] = [
      {
        id: "upload",
        title: "CV Upload Intake",
        status: uploadStatus,
        summary:
          uploadStatus === "healthy"
            ? "Recent uploads are entering the parsing pipeline without storage or validation errors."
            : uploadStatus === "warning"
            ? "Some recent uploads were rejected or needed client-side validation. The monitor is catching them before extraction."
            : "Recent upload failures were detected before parsing completed. Review storage, file validation, and client handoff events.",
        metrics: [
          { label: "Recent upload signals", value: String(uploadSignals.length) },
          { label: "Upload warnings", value: String(uploadWarnings) },
          { label: "Upload failures", value: String(uploadCriticals) },
        ],
        autoFixes: [
          "File-size and file-type validation are checked before extraction starts.",
          "Storage upload failures are recorded as quality signals instead of silently breaking the flow.",
          "Successful upload handoff events mark when the file reaches the parsing engine cleanly.",
        ],
      },
      {
        id: "extraction",
        title: "Parsing & Extraction",
        status: extractionStatus,
        summary:
          extractionStatus === "healthy"
            ? "Recent extraction jobs are completing without a spike in manual-review fallbacks."
            : extractionStatus === "warning"
            ? "Extraction quality is drifting. Guardian recovery is containing issues, but manual review volume is elevated."
            : "Recent extraction failures crossed the safe threshold. Guardian protection is active, but primary parsing needs attention.",
        metrics: [
          { label: "Recent jobs", value: String(extractionJobs) },
          { label: "Review required", value: String(reviewRequiredCount) },
          { label: "Soft failures", value: String(failedSoftCount) },
          { label: "Recovered jobs", value: String(recoveredCount) },
          { label: "Primary multimodal", value: String(multimodalCount) },
          { label: "Avg confidence", value: extractionJobs ? `${Math.round(averageConfidence * 100)}%` : "No data" },
        ],
        autoFixes: [
          "Extraction guardian catches weak or failed runs before they reach the UI.",
          "Manual-review payloads prevent upload crashes during parser or model incidents.",
          "Recent extraction jobs are stored and included in the monitor for trend detection.",
        ],
      },
      {
        id: "editor",
        title: "Editor Export Pipeline",
        status: editorStatus,
        summary:
          editorStatus === "healthy"
            ? "The editor is routing exports through the dedicated print surface instead of slicing a screenshot canvas."
            : "Recent editor export signals reported warnings. Review the latest export events and verify the print route still opens cleanly.",
        metrics: [
          { label: "Recent editor signals", value: String(editorSignals.length) },
          { label: "Editor warnings", value: String(editorWarnings) },
          { label: "Export mode", value: "Print route" },
        ],
        autoFixes: [
          "PDF export is forced through the print-ready route instead of image slicing.",
          "Resume payload is persisted before export so print rendering uses the same live data as the editor.",
        ],
      },
      {
        id: "print",
        title: "Print & Page Break Quality",
        status: printStatus,
        summary:
          printStatus === "healthy"
            ? "Print quality safeguards are active: browser A4 print layout, manual page-break support, and break-avoid rules for resume entries."
            : "Recent print signals reported dialog or layout warnings. Review the latest print events and template output.",
        metrics: [
          { label: "Recent print signals", value: String(printSignals.length) },
          { label: "Print warnings", value: String(printWarnings) },
          { label: "Layout verifications", value: String(layoutVerifications) },
          { label: "Layout risks", value: String(layoutWarnings) },
          { label: "Manual page breaks", value: "Supported" },
          { label: "Break-avoid rules", value: "Enabled" },
        ],
        autoFixes: [
          "Manual page-break blocks are available in the template layout.",
          "Resume entries and section headings are protected with print break-avoid styling.",
          "The print surface runs a page-break inspection before users save the resume as PDF.",
          "Users are routed to Save as PDF through the browser print dialog for cleaner pagination.",
        ],
      },
    ];

    const recentSignals: RecentSignal[] = signals.slice(0, 8).map((signal) => ({
      id: signal.id,
      category: signal.category,
      eventType: signal.eventType,
      status: signal.status,
      summary: signal.summary,
      createdAt: normalizeDate(signal.createdAt),
    }));

    return {
      generatedAt: new Date().toISOString(),
      overallStatus: chooseOverallStatus(checks.map((check) => check.status)),
      checks,
      recentSignals,
    };
  } catch (error) {
    console.error("[QualityEngineer] Failed to build snapshot:", error);

    return {
      generatedAt: new Date().toISOString(),
      overallStatus: "critical",
      checks: [
        {
          id: "monitor",
          title: "Quality Engineer",
          status: "critical",
          summary: "The monitoring layer could not read current health data. Review server logs and Firestore access.",
          metrics: [{ label: "Status", value: "Unavailable" }],
          autoFixes: ["The app keeps runtime safeguards active even when the monitor cannot aggregate data."],
        },
      ],
      recentSignals: [],
    };
  }
}
