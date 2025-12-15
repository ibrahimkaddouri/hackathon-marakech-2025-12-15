'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Video, FileText, RefreshCw, Loader2, CheckCircle, AlertTriangle, XCircle, ThumbsUp } from 'lucide-react'
import { Interview, Evaluation } from '@/types'

export default function InterviewDetailPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [interview, setInterview] = useState<Interview | null>(null)
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; start_ms: number }>>([])
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [loadingT, setLoadingT] = useState(false)
  const [loadingE, setLoadingE] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('interviews')
    if (stored) { const found = JSON.parse(stored).find((i: Interview) => i.id === interviewId); if (found) setInterview(found) }
    const t = localStorage.getItem(`transcript_${interviewId}`); if (t) setTranscript(JSON.parse(t))
    const e = localStorage.getItem(`evaluation_${interviewId}`); if (e) setEvaluation(JSON.parse(e))
  }, [interviewId])

  const fetchTranscript = async () => {
    if (!interview?.recall_bot_id) { alert('No Recall bot ID - interview may not have been created properly'); return }
    setLoadingT(true)
    try {
      const res = await fetch(`/api/interviews/${interviewId}/transcript?bot_id=${interview.recall_bot_id}`)
      const data = await res.json()
      if (res.ok && data.segments?.length) { setTranscript(data.segments); localStorage.setItem(`transcript_${interviewId}`, JSON.stringify(data.segments)) }
      else if (data.message) { alert(data.message) }
    } catch { alert('Failed to fetch') }
    finally { setLoadingT(false) }
  }

  const runEvaluation = async () => {
    if (!transcript.length) { alert('Fetch transcript first'); return }
    setLoadingE(true)
    try {
      const res = await fetch(`/api/interviews/${interviewId}/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: transcript.map(s => `${s.speaker}: ${s.text}`).join('\n') }) })
      const data = await res.json()
      if (res.ok) { setEvaluation(data.evaluation); localStorage.setItem(`evaluation_${interviewId}`, JSON.stringify(data.evaluation)) }
    } catch { alert('Failed') }
    finally { setLoadingE(false) }
  }

  if (!interview) return <div className="container py-10 text-center"><p>Interview not found</p><Button className="mt-4" onClick={() => router.push('/interviews')}>Back</Button></div>

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <div className="mb-6 flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">Interview Details</h1><p className="text-muted-foreground">Scheduled: {new Date(interview.scheduled_at).toLocaleString()}</p></div>
          <div className="flex gap-2">
            <a href={interview.meeting_url} target="_blank"><Button variant="outline"><Video className="mr-2 h-4 w-4" />Join</Button></a>
            {evaluation && <Button onClick={() => router.push(`/candidates/${interview.candidate_id}/decide`)}><ThumbsUp className="mr-2 h-4 w-4" />Decide</Button>}
          </div>
        </div>
        <Tabs defaultValue="transcript">
          <TabsList className="mb-4"><TabsTrigger value="transcript"><FileText className="mr-2 h-4 w-4" />Transcript</TabsTrigger><TabsTrigger value="evaluation"><CheckCircle className="mr-2 h-4 w-4" />Evaluation</TabsTrigger></TabsList>
          <TabsContent value="transcript">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Transcript</CardTitle><CardDescription>{transcript.length ? `${transcript.length} segments` : 'Fetch from Recall.ai'}</CardDescription></div>
                <Button variant="outline" onClick={fetchTranscript} disabled={loadingT}>{loadingT ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Fetch</Button>
              </CardHeader>
              <CardContent>
                {!transcript.length ? <div className="py-10 text-center text-muted-foreground"><FileText className="mx-auto h-12 w-12 mb-4" /><p>No transcript yet</p></div> : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">{transcript.map((s, i) => <div key={i} className="flex gap-3"><span className="text-xs text-muted-foreground w-12">{Math.floor(s.start_ms / 60000)}:{String(Math.floor((s.start_ms % 60000) / 1000)).padStart(2, '0')}</span><div><span className="font-medium text-sm">{s.speaker}</span><p className="text-sm text-muted-foreground">{s.text}</p></div></div>)}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evaluation">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>AI Evaluation</CardTitle><CardDescription>Green, Yellow, Red flags</CardDescription></div>
                <Button onClick={runEvaluation} disabled={loadingE || !transcript.length}>{loadingE ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Evaluate</Button>
              </CardHeader>
              <CardContent>
                {!evaluation ? <div className="py-10 text-center text-muted-foreground"><CheckCircle className="mx-auto h-12 w-12 mb-4" /><p>No evaluation yet</p></div> : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg"><div className="text-4xl font-bold">{evaluation.match_percentage}%</div><div><p className="font-medium">Match Score</p><p className="text-sm text-muted-foreground">{evaluation.match_explanation}</p></div></div>
                    <div><h4 className="font-medium mb-2">Summary</h4><p className="text-sm text-muted-foreground">{evaluation.summary}</p></div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2"><div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4" /><span className="font-medium">Green Flags</span></div><ul className="space-y-1">{evaluation.green_flags.map((f, i) => <li key={i} className="text-sm p-2 bg-green-50 rounded">{f}</li>)}</ul></div>
                      <div className="space-y-2"><div className="flex items-center gap-2 text-yellow-600"><AlertTriangle className="h-4 w-4" /><span className="font-medium">Questions à poser</span></div><ul className="space-y-1">{evaluation.yellow_flags.map((f, i) => <li key={i} className="text-sm p-2 bg-yellow-50 rounded">{f}</li>)}</ul></div>
                      <div className="space-y-2"><div className="flex items-center gap-2 text-red-600"><XCircle className="h-4 w-4" /><span className="font-medium">Red Flags</span></div><ul className="space-y-1">{evaluation.red_flags.map((f, i) => <li key={i} className="text-sm p-2 bg-red-50 rounded">{f}</li>)}</ul></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
