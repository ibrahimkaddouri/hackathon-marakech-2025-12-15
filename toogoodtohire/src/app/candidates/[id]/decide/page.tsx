'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ThumbsUp, ThumbsDown, Send, Loader2, Briefcase, RefreshCw, MailX } from 'lucide-react'
import { RematchSuggestion } from '@/types'

const REASONS = [
  { value: 'technical', label: 'Technical skills do not match requirements' },
  { value: 'experience', label: 'Insufficient experience for role level' },
  { value: 'other_candidate', label: 'Another candidate was better fit' },
  { value: 'position_filled', label: 'Position has been filled' },
  { value: 'other', label: 'Other (specify below)' },
]

export default function DecidePage() {
  const router = useRouter()
  const params = useParams()
  const candidateId = params.id as string
  const [decision, setDecision] = useState<'yes' | 'no' | null>(null)
  const [reasonCat, setReasonCat] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rematch, setRematch] = useState<RematchSuggestion[]>([])
  const [skipEmail, setSkipEmail] = useState(false)

  const handleDecision = async (choice: 'yes' | 'no') => {
    setDecision(choice)
    if (choice === 'no') {
      setLoading(true)
      try {
        const res = await fetch(`/api/candidates/${candidateId}/rematch`, { method: 'POST' })
        const data = await res.json()
        if (res.ok && data.suggestions) setRematch(data.suggestions)
      } catch { }
      finally { setLoading(false) }
    }
  }

  const handleSubmit = async () => {
    if (!decision) return
    if (decision === 'no' && !reasonCat) { alert('Select a reason'); return }
    setLoading(true)
    try {
      const reason = reasonCat === 'other' ? customReason : REASONS.find(r => r.value === reasonCat)?.label
      await fetch(`/api/candidates/${candidateId}/decide`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, reason, reason_category: reasonCat, rematch_suggestions: rematch, skip_email: skipEmail }) })
      const stored = localStorage.getItem('scoringResults')
      if (stored) { const r = JSON.parse(stored); r.candidates = r.candidates.map((c: { id: string }) => c.id === candidateId ? { ...c, status: decision === 'yes' ? 'decided' : 'marketplace' } : c); localStorage.setItem('scoringResults', JSON.stringify(r)) }
      setSubmitted(true)
    } catch { alert('Error') }
    finally { setLoading(false) }
  }

  if (submitted) return (
    <div className="container py-10 text-center">
      <div className="mb-6">{decision === 'yes' ? <ThumbsUp className="mx-auto h-16 w-16 text-green-500" /> : <Briefcase className="mx-auto h-16 w-16 text-blue-500" />}</div>
      <h1 className="text-3xl font-bold">Decision Recorded</h1>
      <p className="mt-4 text-muted-foreground">{decision === 'yes' ? 'Candidate notified of acceptance.' : skipEmail ? 'Candidate added to marketplace (no email sent).' : 'Candidate notified and added to marketplace.'}</p>
      <div className="mt-8 flex justify-center gap-4"><Button variant="outline" onClick={() => router.push('/results')}>Back to Results</Button>{decision === 'no' && <Button onClick={() => router.push(`/marketplace/${candidateId}`)}>View Rematch</Button>}</div>
    </div>
  )

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <h1 className="text-3xl font-bold mb-8">Make Decision</h1>
        {!decision && (
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card className="cursor-pointer hover:border-green-500" onClick={() => handleDecision('yes')}><CardContent className="flex flex-col items-center py-8"><ThumbsUp className="h-12 w-12 text-green-500 mb-4" /><h3 className="text-xl font-semibold">Accept</h3></CardContent></Card>
            <Card className="cursor-pointer hover:border-red-500" onClick={() => handleDecision('no')}><CardContent className="flex flex-col items-center py-8"><ThumbsDown className="h-12 w-12 text-red-500 mb-4" /><h3 className="text-xl font-semibold">Reject</h3></CardContent></Card>
          </div>
        )}
        {decision === 'yes' && (
          <Card><CardHeader><CardTitle className="text-green-600 flex items-center gap-2"><ThumbsUp className="h-5 w-5" />Accept</CardTitle><CardDescription>Candidate will be notified</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="rounded-md bg-green-50 p-4"><p className="text-sm">Acceptance email will be sent.</p></div>
              <div className="flex gap-4"><Button variant="outline" onClick={() => setDecision(null)}>Change</Button><Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Confirm</Button></div>
            </CardContent>
          </Card>
        )}
        {decision === 'no' && (
          <Card><CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><ThumbsDown className="h-5 w-5" />Reject</CardTitle><CardDescription>Non-discriminatory reason required</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label>Reason</Label><Select value={reasonCat} onValueChange={setReasonCat}><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger><SelectContent>{REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              {reasonCat === 'other' && <div className="space-y-2"><Label>Custom Reason</Label><Textarea placeholder="Professional reason..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} /></div>}
              {loading && <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin mr-2" /><span>Finding rematch...</span></div>}
              {rematch.length > 0 && <div className="space-y-2"><Label>Potential Rematch Jobs</Label>{rematch.map(j => <div key={j.job_id} className="flex items-center justify-between p-3 bg-muted rounded-md"><div><p className="font-medium">{j.job_title}</p><p className="text-sm text-muted-foreground">{j.explanation}</p></div><span className="text-lg font-semibold">{j.match_percentage}%</span></div>)}</div>}

              {/* Skip email checkbox */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <input type="checkbox" id="skip-email" checked={skipEmail} onChange={(e) => setSkipEmail(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="skip-email" className="text-sm flex items-center gap-2 cursor-pointer"><MailX className="h-4 w-4" />Don&apos;t send rejection email</label>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setDecision(null)}>Change</Button>
                <Button variant="destructive" onClick={handleSubmit} disabled={loading || !reasonCat}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{skipEmail ? 'Confirm (No Email)' : 'Confirm & Send Email'}</Button>
                <Button onClick={() => router.push(`/marketplace/${candidateId}`)} className="bg-blue-600 hover:bg-blue-700"><RefreshCw className="mr-2 h-4 w-4" />Rematch Candidate</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
