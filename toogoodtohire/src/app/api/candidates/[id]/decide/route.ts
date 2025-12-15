import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params
    const { decision, reason, reason_category, rematch_suggestions } = await request.json()
    if (!decision) return NextResponse.json({ error: 'decision required' }, { status: 400 })

    const record = { id: crypto.randomUUID(), candidate_id: candidateId, decision, reason, reason_category, rematch_suggestions: decision === 'no' ? rematch_suggestions : null, email_sent_at: new Date().toISOString() }
    console.log('Decision:', record)
    return NextResponse.json({ success: true, decision: record })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
