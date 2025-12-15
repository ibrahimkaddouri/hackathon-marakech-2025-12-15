'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Video, FileText, ArrowRight } from 'lucide-react'
import { Interview } from '@/types'

export default function InterviewsPage() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('interviews')
    if (stored) setInterviews(JSON.parse(stored))
  }, [])

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Interviews</h1>
        {interviews.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><Video className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">No interviews yet</h3><Button className="mt-4" onClick={() => router.push('/results')}>Go to Results</Button></CardContent></Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>All Interviews</CardTitle><CardDescription>{interviews.length} scheduled</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Scheduled</TableHead><TableHead>Meeting</TableHead><TableHead>Bot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {interviews.map(i => (
                    <TableRow key={i.id}>
                      <TableCell>{new Date(i.scheduled_at).toLocaleString()}</TableCell>
                      <TableCell><a href={i.meeting_url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1"><Video className="h-3 w-3" />Join</a></TableCell>
                      <TableCell><Badge variant={i.recall_bot_id ? 'outline' : 'secondary'}>{i.recall_bot_id ? 'Ready' : 'No Bot'}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => router.push(`/interviews/${i.id}`)}><FileText className="mr-1 h-3 w-3" />View<ArrowRight className="ml-1 h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
