"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { ArrowLeft, BadgeCheck, Briefcase, ExternalLink, Loader2, MapPin, ShieldAlert } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  buildTrackedApplicationPayload,
  getSafeJobSource,
  JOB_SOURCE_CONFIG,
  JOB_SOURCE_DEFAULT_URLS,
  JOB_STATUS_CONFIG,
  type JobApplicationRecord,
  type JobListingRecord,
} from "@/lib/jobs/model"

type TrackedApplication = JobApplicationRecord & { id: string }

type ApplyIntent = {
  canEmbed: boolean
  launchMode: "iframe" | "external"
  reason: string
  note: string
  targetUrl: string
  checkedAt: string
}

export default function JobApplyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("applicationId")
  const db = useFirestore()
  const { user } = useUser()

  const applicationRef = useMemoFirebase(() => {
    if (!db || !user || !applicationId) return null
    return doc(db, "users", user.uid, "jobApplications", applicationId)
  }, [db, user, applicationId])

  const { data: application, isLoading, error } = useDoc<TrackedApplication>(applicationRef)
  const [applyIntent, setApplyIntent] = useState<ApplyIntent | null>(null)
  const [isCheckingIntent, setIsCheckingIntent] = useState(false)
  const [isMarkingApplied, setIsMarkingApplied] = useState(false)

  const source = getSafeJobSource(application?.source)
  const listing = useMemo<JobListingRecord | null>(() => {
    if (!application) return null

    return {
      id: application.jobListingId || application.id,
      externalJobId: application.externalJobId || undefined,
      source,
      sourceUrl: application.sourceUrl || JOB_SOURCE_DEFAULT_URLS[source],
      company: application.company,
      role: application.role,
      location: application.location || "Location not specified",
      workplaceType: application.workplaceType || "remote",
      employmentType: application.employmentType || "full-time",
      shortDescription: application.jobDescription || "Tracked application record.",
      postedLabel: application.statusLabel || JOB_STATUS_CONFIG[application.status].label,
      tags: [],
      listingOrigin: application.listingOrigin || "partner_feed",
      integrationMode: application.partnerSync?.integrationMode || "redirect",
      partnerCapabilities: application.partnerSync?.capabilities || JOB_SOURCE_CONFIG[source].plannedCapabilities,
    }
  }, [application, source])

  useEffect(() => {
    if (!listing) return

    let isCancelled = false

    const run = async () => {
      setIsCheckingIntent(true)
      try {
        const response = await fetch("/api/jobs/apply-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: listing.source, url: listing.sourceUrl }),
        })
        const data = (await response.json()) as ApplyIntent | { error?: string }
        if (!isCancelled) {
          setApplyIntent("canEmbed" in data ? data : null)
        }
      } catch (applyError) {
        console.error("Failed to resolve apply intent:", applyError)
        if (!isCancelled) {
          setApplyIntent(null)
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingIntent(false)
        }
      }
    }

    run()

    return () => {
      isCancelled = true
    }
  }, [listing])

  const handleMarkApplied = async () => {
    if (!db || !user || !listing || !application) return

    setIsMarkingApplied(true)
    try {
      const payload = buildTrackedApplicationPayload({
        userId: user.uid,
        listing,
        status: "applied",
        statusSource: "apply_confirmation",
        note: "User confirmed the application was submitted from the apply workspace.",
        resumeId: application.resumeId || null,
        resumeName: application.resumeName || null,
        existingHistory: application.statusHistory,
        existingAppliedAt: application.appliedAt || null,
      })

      await updateDoc(doc(db, "users", user.uid, "jobApplications", application.id), {
        ...payload,
        notes: application.notes || "",
        jobDescription: application.jobDescription || "",
        partnerSync: application.partnerSync || payload.partnerSync,
        sourceClickStartedAt: application.sourceClickStartedAt || payload.sourceClickStartedAt,
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "Application marked as applied",
        description: "Your tracker has been updated and your application history is saved.",
      })
      router.push("/tracker")
    } catch (markError) {
      console.error("Failed to mark application as applied:", markError)
      toast({
        variant: "destructive",
        title: "Couldn't update application",
        description: "We couldn't mark this role as applied right now.",
      })
    } finally {
      setIsMarkingApplied(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!applicationId || error || !application || !listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <Card className="border-none bg-white shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <ShieldAlert className="h-10 w-10 text-destructive/70" />
            <div className="space-y-1">
              <p className="text-lg font-black text-primary">We couldn&apos;t load this application workspace</p>
              <p className="text-sm text-muted-foreground">The tracked application may have been removed, or you may need to start the apply flow again.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-xl font-bold" asChild>
                <Link href="/jobs">Back to jobs</Link>
              </Button>
              <Button variant="outline" className="rounded-xl font-bold" asChild>
                <Link href="/tracker">Open tracker</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sourceConfig = JOB_SOURCE_CONFIG[source]
  const canEmbed = Boolean(applyIntent?.canEmbed)
  const targetUrl = applyIntent?.targetUrl || listing.sourceUrl

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-muted/20 md:h-[calc(100vh-4rem)] md:min-h-0 md:overflow-hidden">
      <header className="flex-none border-b bg-white/50 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" asChild>
              <Link href="/jobs">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider", sourceConfig.badgeClassName)}>
                  {sourceConfig.label}
                </Badge>
                <div className="h-1 w-1 rounded-full bg-border" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workspace</p>
              </div>
              <h1 className="text-lg font-black tracking-tight text-primary md:text-xl">Apply Workspace: {application.role}</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:gap-3">
            <Button variant="outline" className="h-10 rounded-xl font-bold md:h-11" asChild>
              <a href={targetUrl} target="_blank" rel="noreferrer">
                Open source
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button className="h-10 rounded-xl font-bold shadow-lg shadow-primary/20 md:h-11" onClick={handleMarkApplied} disabled={isMarkingApplied}>
              {isMarkingApplied ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
              Mark as applied
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-visible p-4 md:overflow-hidden md:p-8">
        <div className="mx-auto h-full max-w-[1600px]">
          <div className="grid gap-4 md:gap-6 xl:h-full xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="flex flex-col gap-4 md:gap-6 xl:overflow-y-auto xl:pr-2">
              <Card className="flex-none border-none bg-white shadow-sm ring-1 ring-black/[0.03]">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl font-black leading-none tracking-tight text-primary md:text-2xl">{application.role}</CardTitle>
                  <CardDescription className="text-sm font-bold text-muted-foreground">{application.company}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-6">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-[0.68rem] font-bold text-muted-foreground uppercase tracking-widest ring-1 ring-black/[0.03]">
                      <MapPin className="h-3 w-3" />
                      {application.location || "Location not specified"}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-[0.68rem] font-bold text-muted-foreground uppercase tracking-widest ring-1 ring-black/[0.03]">
                      <Briefcase className="h-3 w-3" />
                      {application.workplaceType || "remote"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-primary/60">Selected CV</p>
                      <p className="mt-1.5 text-sm font-bold text-primary">{application.resumeName || "General resume"}</p>
                    </div>

                    <div className="rounded-2xl border border-dashed p-4">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-muted-foreground">Experience mode</p>
                      {isCheckingIntent ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground italic">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Verifying surface...
                        </div>
                      ) : (
                        <>
                          <p className="mt-1.5 text-sm font-bold text-primary">{canEmbed ? "Full in-app workspace" : "Secure handoff only"}</p>
                          <p className="mt-1.5 text-xs font-medium leading-relaxed text-muted-foreground">{applyIntent?.note || "Direct secure link provided below."}</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-1 flex-col rounded-[1.4rem] bg-indigo-50/50 p-4 ring-1 ring-indigo-500/10 md:rounded-[2rem] md:p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-900/60">Workspace Guide</h3>
                <div className="mt-4 space-y-4">
                  {[
                    "Review the job requirements and your linked CV.",
                    "Interact with the job board on the right to submit.",
                    "Click 'Mark as applied' above once you're done."
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[0.65rem] font-black text-indigo-600 ring-1 ring-indigo-500/20">{i + 1}</span>
                      <p className="text-[0.8rem] font-medium leading-tight text-indigo-950/70">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Card className="flex min-h-[65dvh] flex-col overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/[0.03] md:min-h-[70dvh] xl:h-full xl:min-h-0">
              <CardContent className="h-full p-0">
                {isCheckingIntent ? (
                  <div className="flex h-full items-center justify-center bg-muted/5">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Constructing apply surface...</p>
                    </div>
                  </div>
                ) : canEmbed ? (
                  <iframe
                    src={targetUrl}
                    title={`${application.role} application`}
                    className="h-full w-full border-none"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center md:p-12">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-500/10">
                      <ShieldAlert className="h-10 w-10" />
                    </div>
                    <div className="mt-8 space-y-3">
                      <p className="text-2xl font-black text-primary tracking-tight">Handoff Required</p>
                      <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
                        This job board ({sourceConfig.label}) prevents embedding for security reasons. Your workspace is ready to bridge the gap.
                      </p>
                    </div>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                      <Button className="h-11 rounded-2xl px-6 text-sm font-black shadow-xl shadow-primary/20 md:h-14 md:px-10 md:text-lg" asChild>
                        <a href={targetUrl} target="_blank" rel="noreferrer">
                          Open application
                          <ExternalLink className="ml-3 h-5 w-5" />
                        </a>
                      </Button>
                      <Button variant="ghost" className="h-11 rounded-2xl px-6 text-sm font-black md:h-14 md:px-10 md:text-lg" asChild>
                        <Link href="/tracker">Return to tracker</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
