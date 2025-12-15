import { NextRequest, NextResponse } from 'next/server'
import { createRecallBot } from '@/lib/recall'

export async function POST(request: NextRequest) {
  try {
    const { candidate_id, meeting_url, scheduled_at } = await request.json()
    if (!candidate_id || !meeting_url || !scheduled_at) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    let recallBot = null
    try { recallBot = await createRecallBot(meeting_url, 'TooGoodToHire Bot') } catch (e) { console.error('Recall error:', e) }

    const interview = { id: crypto.randomUUID(), candidate_id, meeting_url, scheduled_at, recall_bot_id: recallBot?.id || null, status: 'scheduled', created_at: new Date().toISOString() }
    return NextResponse.json({ success: true, interview })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
