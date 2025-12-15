import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/hrflow'

export async function POST(request: NextRequest) {
  try {
    const { job_reference } = await request.json()
    if (!job_reference) return NextResponse.json({ error: 'job_reference is required' }, { status: 400 })

    const required = ['HRFLOW_API_KEY', 'HRFLOW_USER_EMAIL', 'HRFLOW_BOARD_KEY', 'HRFLOW_SOURCE_KEY', 'HRFLOW_ALGORITHM_KEY']
    const missing = required.filter(v => !process.env[v])
    if (missing.length) return NextResponse.json({ error: `Missing env: ${missing.join(', ')}` }, { status: 500 })

    const job = await getJob(job_reference)
    return NextResponse.json({ success: true, job: { key: job.key, reference: job.reference, name: job.name, summary: job.summary } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Connection failed' }, { status: 500 })
  }
}
