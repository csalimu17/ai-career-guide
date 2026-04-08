import { JobListingRecord } from "./model"

export interface JobFetchParams {
  keywords?: string
  location?: string
  workplace?: "all" | "remote" | "hybrid" | "onsite"
  page?: number
  pageSize?: number
}

export interface JobApiAdapter {
  name: string
  fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]>
}
