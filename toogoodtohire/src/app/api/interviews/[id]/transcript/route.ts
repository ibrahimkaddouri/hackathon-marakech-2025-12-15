import { NextRequest, NextResponse } from 'next/server'
import { getTranscript, normalizeTranscript, getBotStatus, mapRecallStatus } from '@/lib/recall'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params

    // Get bot_id from query parameter
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('bot_id')

    if (!botId) {
      return NextResponse.json({
        segments: [],
        status: 'scheduled',
        message: 'No Recall bot ID provided',
      })
    }

    // Get bot status
    const bot = await getBotStatus(botId)
    const lastStatus = bot.status_changes?.[bot.status_changes.length - 1]?.code || bot.status?.code || 'unknown'
    const status = mapRecallStatus(lastStatus)

    // If call is still in progress, return empty transcript with status
    if (status === 'scheduled' || status === 'in_progress') {
      return NextResponse.json({
        segments: [],
        status,
        message: 'Interview still in progress - transcript available after call ends',
      })
    }

    // Fetch real transcript from Recall.ai
    const rawSegments = await getTranscript(botId)

    // If no transcript available yet
    if (!rawSegments || rawSegments.length === 0) {
      return NextResponse.json({
        segments: [],
        status,
        message: 'Transcript not yet available',
      })
    }

    // Normalize to our format
    const segments = normalizeTranscript(rawSegments)

    return NextResponse.json({
      segments,
      status,
    })
  } catch (error) {
    console.error('Transcript fetch error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
