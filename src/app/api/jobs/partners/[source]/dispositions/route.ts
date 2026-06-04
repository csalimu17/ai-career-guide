import { buildPartnerNotConnectedResponse } from "@/lib/jobs/partner-api"

export async function POST(_: Request, context: { params: Promise<{ source: string }> }) {
  const { source } = await context.params
  return buildPartnerNotConnectedResponse(source, "dispositions")
}
