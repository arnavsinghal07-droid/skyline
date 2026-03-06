export type SignalType = 'pain_point' | 'switching_reason' | 'feature_request' | 'positive_mention'
export type ScrapingJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface CompetitorRow {
  id: string
  org_id: string
  workspace_id: string
  name: string
  g2_slug: string | null
  capterra_slug: string | null
  mention_count: number
  last_scraped_at: string | null
  deleted_at: string | null
  created_at: string
}

export interface CompetitiveSignal {
  id: string
  org_id: string
  workspace_id: string
  competitor_id: string
  quote: string
  signal_type: SignalType
  source: 'g2' | 'capterra' | 'csv'
  review_source_id: string | null
  reviewer_role: string | null
  company_size: string | null
  review_date: string | null
  created_at: string
}

export interface ScrapingJob {
  id: string
  org_id: string
  competitor_id: string
  status: ScrapingJobStatus
  attempts: number
  error_message: string | null
  signals_extracted: number
  created_at: string
  updated_at: string
}

export interface ExtractedSignal {
  quote: string
  signal_type: SignalType
  reviewer_role?: string
  company_size?: string
}

export const COMPETITOR_LIMITS: Record<string, number> = {
  free: 3,
  starter: 10,
  pro: Infinity,
}
