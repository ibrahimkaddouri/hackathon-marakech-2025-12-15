import { NextRequest, NextResponse } from 'next/server'
import { getJob, scoreProfiles, profileToCandidate } from '@/lib/hrflow'
import { HRFlowProfile } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { job_reference, top_k = 10, score_threshold = 0 } = await request.json()
    if (!job_reference) return NextResponse.json({ error: 'job_reference is required' }, { status: 400 })

    const job = await getJob(job_reference)
    const profiles = await scoreProfiles(job_reference, top_k, score_threshold)
    const candidates = profiles.map((p: HRFlowProfile & { score?: number }) => profileToCandidate(p, p.score ?? 0))
    candidates.sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    return NextResponse.json({ success: true, job: { key: job.key, reference: job.reference, name: job.name }, candidates, total_scored: candidates.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scoring failed' }, { status: 500 })
  }
}
