'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Briefcase, Send, UserPlus, Loader2 } from 'lucide-react'
import { RematchSuggestion } from '@/types'

export default function MarketplacePage() {
  const router = useRouter()
  const params = useParams()
  const candidateId = params.id as string
  const [jobs, setJobs] = useState<RematchSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState<string | null>(null)

  useEffect(() => {
    const fetchRematch = async () => {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/rematch`, { method: 'POST' })
        const data = await res.json()
        if (res.ok && data.suggestions) setJobs(data.suggestions)
      } catch { }
      finally { setLoading(false) }
    }
    fetchRematch()
  }, [candidateId])

  const handlePropose = async (jobId: string) => {
    setProposing(jobId)
    await new Promise(r => setTimeout(r, 1000))
    alert(`Candidate proposed for job ${jobId}`)
    setProposing(null)
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <div className="mb-8 flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">Marketplace</h1><p className="mt-2 text-muted-foreground">Find alternative opportunities</p></div>
          <Button variant="outline" onClick={() => { alert('Added to TalentPool'); router.push('/results') }}><UserPlus className="mr-2 h-4 w-4" />Add to TalentPool</Button>
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Recommended Jobs</CardTitle><CardDescription>Jobs matching this candidate</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : jobs.length === 0 ? <div className="py-10 text-center text-muted-foreground"><Briefcase className="mx-auto h-12 w-12 mb-4" /><p>No matching jobs</p></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Job Title</TableHead><TableHead>Match</TableHead><TableHead>Explanation</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {jobs.map(j => (
                    <TableRow key={j.job_id}>
                      <TableCell className="font-medium">{j.job_title}</TableCell>
                      <TableCell><Badge variant={j.match_percentage >= 70 ? 'default' : 'secondary'}>{j.match_percentage}%</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{j.explanation}</TableCell>
                      <TableCell className="text-right"><Button size="sm" onClick={() => handlePropose(j.job_id)} disabled={proposing === j.job_id}>{proposing === j.job_id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}Propose</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
