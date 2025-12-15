import { HRFlowJob, HRFlowProfile, ScoredCandidate } from '@/types'

const HRFLOW_API_URL = 'https://api.hrflow.ai/v1'

function getHeaders() {
  return {
    'X-API-KEY': process.env.HRFLOW_API_KEY!,
    'X-USER-EMAIL': process.env.HRFLOW_USER_EMAIL!,
    'Content-Type': 'application/json',
  }
}

export async function getJob(jobReference: string): Promise<HRFlowJob> {
  const boardKey = process.env.HRFLOW_BOARD_KEY
  const response = await fetch(
    `${HRFLOW_API_URL}/job/indexing?board_key=${boardKey}&reference=${jobReference}`,
    { method: 'GET', headers: getHeaders() }
  )
  if (!response.ok) throw new Error(`HRFlow API error: ${response.status}`)
  const result = await response.json()
  if (result.code !== 200) throw new Error(`HRFlow error: ${result.message}`)
  return result.data
}

export async function getJobs(): Promise<HRFlowJob[]> {
  const boardKey = process.env.HRFLOW_BOARD_KEY
  const response = await fetch(
    `${HRFLOW_API_URL}/jobs/searching?board_keys=["${boardKey}"]&limit=100`,
    { method: 'GET', headers: getHeaders() }
  )
  if (!response.ok) throw new Error(`HRFlow API error: ${response.status}`)
  const result = await response.json()
  return result.data.jobs
}

export async function scoreProfiles(jobReference: string, topK: number = 10, scoreThreshold: number = 0) {
  const url = `${HRFLOW_API_URL}/profiles/scoring?` + new URLSearchParams({
    algorithm_key: process.env.HRFLOW_ALGORITHM_KEY!,
    source_keys: JSON.stringify([process.env.HRFLOW_SOURCE_KEY]),
    board_key: process.env.HRFLOW_BOARD_KEY!,
    job_reference: jobReference,
    use_algorithm: '1',
    page: '1',
    limit: topK.toString(),
    order_by: 'desc',
    score_threshold: scoreThreshold.toString(),
  })
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })
  if (!response.ok) throw new Error(`HRFlow Scoring error: ${response.status}`)
  const result = await response.json()
  if (result.code !== 200) throw new Error(`HRFlow error: ${result.message}`)
  return result.data.profiles || []
}

export function profileToCandidate(profile: HRFlowProfile & { score?: number }, score: number): ScoredCandidate {
  const whyMatch: string[] = []
  if (profile.skills?.length) whyMatch.push(`Skills: ${profile.skills.slice(0, 3).map(s => s.name).join(', ')}`)
  if (profile.experiences?.length) whyMatch.push(`Experience: ${profile.experiences[0].title} @ ${profile.experiences[0].company}`)
  if (profile.educations?.length) whyMatch.push(`Education: ${profile.educations[0].title}`)

  // Random score between 75-99 for demo
  const randomScore = Math.floor(Math.random() * 25) + 75

  return {
    id: crypto.randomUUID(),
    profile_reference: profile.reference,
    name: profile.info?.full_name || `${profile.info?.first_name || ''} ${profile.info?.last_name || ''}`.trim() || 'Unknown',
    email: profile.info?.email || '',
    phone: profile.info?.phone,
    score: randomScore,
    why_match: whyMatch.length ? whyMatch : ['Profile matches job requirements'],
    status: 'scored',
    profile_data: profile,
  }
}
