'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, Video, Loader2, Mail } from 'lucide-react'

export default function SchedulePage() {
  const router = useRouter()
  const params = useParams()
  const candidateId = params.id as string
  const [meetingUrl, setMeetingUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!meetingUrl || !scheduledAt || !candidateEmail) { alert('Please fill all fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/interviews/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate_id: candidateId, meeting_url: meetingUrl, scheduled_at: scheduledAt, candidate_email: candidateEmail }) })
      const data = await res.json()
      if (res.ok) {
        const stored = localStorage.getItem('scoringResults')
        if (stored) { const r = JSON.parse(stored); r.candidates = r.candidates.map((c: { id: string }) => c.id === candidateId ? { ...c, status: 'scheduled' } : c); localStorage.setItem('scoringResults', JSON.stringify(r)) }
        const interviews = JSON.parse(localStorage.getItem('interviews') || '[]'); interviews.push(data.interview); localStorage.setItem('interviews', JSON.stringify(interviews))
        router.push(`/interviews/${data.interview.id}`)
      } else alert(data.error)
    } catch { alert('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <h1 className="text-3xl font-bold mb-8">Schedule Interview</h1>
        <Card>
          <CardHeader><CardTitle>Interview Details</CardTitle><CardDescription>A Recall.ai bot will join to transcribe</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Candidate Email</Label>
              <div className="flex gap-2"><Mail className="h-5 w-5 text-muted-foreground mt-2" /><Input type="email" placeholder="candidate@email.com" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Meeting URL</Label>
              <div className="flex gap-2"><Video className="h-5 w-5 text-muted-foreground mt-2" /><Input placeholder="https://meet.google.com/xxx" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <div className="flex gap-2"><Calendar className="h-5 w-5 text-muted-foreground mt-2" /><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
            </div>
            <div className="rounded-md bg-muted p-4"><h4 className="font-medium mb-2">What happens next?</h4><ul className="text-sm text-muted-foreground space-y-1"><li>1. Recall bot joins at scheduled time</li><li>2. Transcript generated</li><li>3. Evaluate candidate after call</li></ul></div>
            <Button className="w-full" onClick={handleCreate} disabled={loading || !meetingUrl || !scheduledAt || !candidateEmail}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}Create Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
