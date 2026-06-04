import { NextResponse } from "next/server"

import { JOB_PARTNER_ROUTE_BLUEPRINT, JOB_SOURCE_CONFIG, isJobSource } from "@/lib/jobs/model"

export function buildUnsupportedSourceResponse(source: string) {
  return NextResponse.json(
    {
      ok: false,
      error: "unsupported_source",
      message: `The source '${source}' is not part of the supported jobs partner architecture.`,
      supportedSources: Object.keys(JOB_SOURCE_CONFIG),
    },
    { status: 400 }
  )
}

export function buildPartnerNotConnectedResponse(source: string, routeKind: "search" | "apply-intents" | "dispositions" | "webhooks") {
  if (!isJobSource(source)) {
    return buildUnsupportedSourceResponse(source)
  }

  return NextResponse.json(
    {
      ok: false,
      source,
      routeKind,
      status: "not_connected",
      integrationMode: JOB_SOURCE_CONFIG[source].integrationMode,
      plannedCapabilities: JOB_SOURCE_CONFIG[source].plannedCapabilities,
      message: `${JOB_SOURCE_CONFIG[source].label} is wired into the partner-ready route contract, but no official partner credentials have been connected yet.`,
      nextStep: "Connect official partner credentials or ATS webhooks before enabling this route in production.",
      routeBlueprint: JOB_PARTNER_ROUTE_BLUEPRINT.apiRoutes,
    },
    { status: 501 }
  )
}
