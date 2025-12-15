const RECALL_REGION = process.env.RECALL_REGION || 'eu-central-1'
const RECALL_API_URL = `https://${RECALL_REGION}.recall.ai/api/v1`

interface RecallBot {
  id: string
  meeting_url: string
  status?: { code: string; message?: string }
  status_changes?: Array<{ code: string; message: string; created_at: string }>
  recordings?: Array<{
    media_shortcuts?: {
      transcript?: {
        data?: { download_url?: string }
      }
    }
  }>
}

// New format (transcript download after call ends)
interface RecallTranscriptSegmentNew {
  participant: {
    id: number
    name: string
    is_host?: boolean
    platform?: string
  }
  words: Array<{
    text: string
    start_timestamp: { relative: number; absolute: string }
    end_timestamp: { relative: number; absolute: string }
  }>
}

// Old format (webhook real-time)
interface RecallTranscriptSegmentOld {
  speaker: string
  speaker_id: number
  words: Array<{
    text: string
    start_time: number
    end_time: number
    confidence: number
  }>
}

type RecallTranscriptSegment = RecallTranscriptSegmentNew | RecallTranscriptSegmentOld

export async function createRecallBot(meetingUrl: string, botName: string = 'TooGoodToHire'): Promise<RecallBot> {
  const response = await fetch(`${RECALL_API_URL}/bot/`, {
    method: 'POST',
    headers: { Authorization: `Token ${process.env.RECALL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: botName,
      automatic_leave: { waiting_room_timeout: 600, noone_joined_timeout: 600 },
      recording_config: {
        transcript: {
          provider: { deepgram_streaming: { model: 'nova-2', language: 'fr', smart_format: 'true', punctuate: 'true', diarize: 'true' } }
        }
        // NO realtime_endpoints - no Lambda needed, we fetch transcript after call ends
      },
    }),
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Recall API error: ${response.status} - ${error}`)
  }
  return response.json()
}

export async function getBotStatus(botId: string): Promise<RecallBot> {
  const response = await fetch(`${RECALL_API_URL}/bot/${botId}/`, {
    headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
  })
  if (!response.ok) throw new Error(`Recall API error: ${response.statusText}`)
  return response.json()
}

// Fetch transcript after call ends - downloads from recordings[0].media_shortcuts.transcript.data.download_url
export async function getTranscript(botId: string): Promise<RecallTranscriptSegment[]> {
  // Get bot info to find the transcript download URL
  const botResponse = await fetch(`${RECALL_API_URL}/bot/${botId}/`, {
    headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
  })

  if (!botResponse.ok) {
    console.log('Recall bot fetch error:', botResponse.status)
    return []
  }

  const bot: RecallBot = await botResponse.json()
  const lastStatus = bot.status_changes?.[bot.status_changes.length - 1]?.code
  console.log('Bot status:', lastStatus || bot.status?.code)

  // Check if recording has transcript available
  const recording = bot.recordings?.[0]
  const transcriptUrl = recording?.media_shortcuts?.transcript?.data?.download_url

  if (!transcriptUrl) {
    console.log('No transcript URL available yet - call may still be in progress')
    return []
  }

  // Download the transcript JSON
  console.log('Downloading transcript from:', transcriptUrl)
  const transcriptResponse = await fetch(transcriptUrl)
  if (!transcriptResponse.ok) {
    console.log('Failed to download transcript:', transcriptResponse.status)
    return []
  }

  const transcriptData = await transcriptResponse.json()
  console.log('Transcript segments count:', transcriptData?.length || 0)

  return transcriptData
}

// Convert Recall transcript to our format (handles both old and new formats)
export function normalizeTranscript(segments: RecallTranscriptSegment[]): Array<{
  speaker: string
  text: string
  start_ms: number
  end_ms: number
  confidence: number
}> {
  return segments.map((segment) => {
    // Check if it's the new format (has participant) or old format (has speaker)
    const isNewFormat = 'participant' in segment

    if (isNewFormat) {
      // New format with participant and timestamps
      const newSegment = segment as RecallTranscriptSegmentNew
      const words = newSegment.words || []
      const text = words.map((w) => w.text).join(' ')

      const start_ms = words.length > 0
        ? Math.round(words[0].start_timestamp.relative * 1000)
        : 0
      const end_ms = words.length > 0
        ? Math.round(words[words.length - 1].end_timestamp.relative * 1000)
        : 0

      return {
        speaker: newSegment.participant?.name || `Participant ${newSegment.participant?.id}`,
        text,
        start_ms,
        end_ms,
        confidence: 1.0, // New format doesn't include confidence
      }
    } else {
      // Old format with speaker and start_time/end_time
      const oldSegment = segment as RecallTranscriptSegmentOld
      const words = oldSegment.words || []
      const text = words.map((w) => w.text).join(' ')

      const start_ms = words.length > 0
        ? Math.round(words[0].start_time * 1000)
        : 0
      const end_ms = words.length > 0
        ? Math.round(words[words.length - 1].end_time * 1000)
        : 0
      const avgConfidence = words.length > 0
        ? words.reduce((sum, w) => sum + (w.confidence || 1), 0) / words.length
        : 1.0

      return {
        speaker: oldSegment.speaker || `Speaker ${oldSegment.speaker_id}`,
        text,
        start_ms,
        end_ms,
        confidence: avgConfidence,
      }
    }
  })
}

// Map Recall bot status to our interview status
export function mapRecallStatus(code: string): 'scheduled' | 'in_progress' | 'completed' | 'failed' {
  switch (code) {
    case 'joining_call':
    case 'in_waiting_room':
      return 'scheduled'
    case 'in_call_recording':
    case 'in_call_not_recording':
      return 'in_progress'
    case 'call_ended':
    case 'done':
      return 'completed'
    case 'fatal':
    case 'analysis_failed':
      return 'failed'
    default:
      return 'scheduled'
  }
}
