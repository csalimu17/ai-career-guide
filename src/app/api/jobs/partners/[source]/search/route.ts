import { buildPartnerNotConnectedResponse } from "@/lib/jobs/partner-api"

export async function GET(_: Request, context: { params: Promise<{ source: string }> }) {
  const { source } = await context.params
  return buildPartnerNotConnectedResponse(source, "search")
}
