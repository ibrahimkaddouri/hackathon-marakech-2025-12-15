export type CandidateStatus = 'scored' | 'invited' | 'scheduled' | 'interview_done' | 'evaluated' | 'decided' | 'marketplace'
export type InterviewStatus = 'created' | 'scheduled' | 'in_progress' | 'completed' | 'failed'

export interface HRFlowJob {
  key: string
  reference: string
  name: string
  summary: string
  skills: Array<{ name: string; type: string }>
}

export interface HRFlowProfile {
  key: string
  reference: string
  info: { full_name: string; first_name: string; last_name: string; email: string; phone: string }
  text: string
  experiences: Array<{ title: string; company: string; description: string }>
  educations: Array<{ title: string; school: string }>
  skills: Array<{ name: string; type: string }>
}

export interface ScoredCandidate {
  id: string
  profile_reference: string
  name: string
  email: string
  phone?: string
  score: number
  why_match: string[]
  status: CandidateStatus
  profile_data?: HRFlowProfile
}

export interface Interview {
  id: string
  candidate_id: string
  meeting_url: string
  scheduled_at: string
  recall_bot_id: string | null
  status: InterviewStatus
}

export interface Evaluation {
  summary: string
  green_flags: string[]
  yellow_flags: string[]
  red_flags: string[]
  match_percentage: number
  match_explanation: string
}

export interface RematchSuggestion {
  job_id: string
  job_title: string
  match_percentage: number
  explanation: string
}
