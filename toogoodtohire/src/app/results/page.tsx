'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScoredCandidate, HRFlowJob } from '@/types'
import { ArrowLeft, Users, CheckCircle, Mail, Calendar } from 'lucide-react'

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<{ job: HRFlowJob; candidates: ScoredCandidate[] } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('scoringResults')
    if (stored) setResults(JSON.parse(stored))
  }, [])

  const handleInvite = (id: string) => {
    if (results) {
      const updated = { ...results, candidates: results.candidates.map(c => c.id === id ? { ...c, status: 'invited' as const } : c) }
      setResults(updated); localStorage.setItem('scoringResults', JSON.stringify(updated))
    }
  }

  if (!results) return (
    <div className="container py-10 text-center">
      <h1 className="text-2xl font-bold">No Results</h1>
      <p className="mt-2 text-muted-foreground">Run scoring first</p>
      <Button className="mt-4" onClick={() => router.push('/')}><ArrowLeft className="mr-2 h-4 w-4" />Back to Setup</Button>
    </div>
  )

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scoring Results</h1>
            <p className="mt-1 text-muted-foreground">{results.job.name} - {results.candidates.length} candidates</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}><ArrowLeft className="mr-2 h-4 w-4" />New Scoring</Button>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5" />{results.candidates.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">High Match (80%+)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" />{results.candidates.filter(c => c.score >= 80).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Invited</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2 text-blue-600"><Mail className="h-5 w-5" />{results.candidates.filter(c => c.status !== 'scored').length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Candidates</CardTitle><CardDescription>Sorted by score</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Why</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {results.candidates.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell><ul className="text-sm text-muted-foreground">{c.why_match.slice(0, 2).map((w, i) => <li key={i} className="truncate max-w-xs">{w}</li>)}</ul></TableCell>
                    <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {c.status === 'scored' && <Button size="sm" variant="outline" onClick={() => handleInvite(c.id)}><Mail className="mr-1 h-3 w-3" />Invite</Button>}
                      {c.status === 'invited' && <Button size="sm" onClick={() => router.push(`/candidates/${c.id}/schedule`)}><Calendar className="mr-1 h-3 w-3" />Schedule</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
