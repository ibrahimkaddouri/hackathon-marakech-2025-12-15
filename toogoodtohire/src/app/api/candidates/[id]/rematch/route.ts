import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params
    // Mock rematch suggestions (in prod: fetch from HRFlow)
    const suggestions = [
      { job_id: 'job_1', job_title: 'Frontend Developer', match_percentage: 72, explanation: 'Strong React skills match' },
      { job_id: 'job_2', job_title: 'Full Stack Engineer', match_percentage: 68, explanation: 'Experience aligns with stack' },
      { job_id: 'job_3', job_title: 'Software Engineer', match_percentage: 61, explanation: 'General engineering fit' },
    ]
    return NextResponse.json({ success: true, suggestions })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
