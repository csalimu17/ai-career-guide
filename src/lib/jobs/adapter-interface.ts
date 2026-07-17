import { JobListingRecord } from "./model"

export interface JobFetchParams {
  keywords?: string
  location?: string
  workplace?: "all" | "remote" | "hybrid" | "onsite"
  page?: number
  pageSize?: number
}

export type JobFetchResultMeta = {
  listings: JobListingRecord[]
  /** Estimated total matching jobs in the provider, if available. */
  total?: number
}

export interface JobApiAdapter {
  name: string
  fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]>
  /** Optional: provider supports returning total count metadata. */
  fetchJobsWithMeta?: (params: JobFetchParams) => Promise<JobFetchResultMeta>
  /** Fetches the full job description/content for a specific job ID */
  fetchJobDetails(externalId: string): Promise<string | null>
}
