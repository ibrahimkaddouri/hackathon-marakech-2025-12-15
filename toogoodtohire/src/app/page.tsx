'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Play, CheckCircle, AlertCircle, Upload, FileText, X } from 'lucide-react'

interface UploadResult {
  reference: string
  filename: string
  success: boolean
  message?: string
}

export default function SetupPage() {
  const router = useRouter()
  const [jobReference, setJobReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  // CV Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [uploadMessage, setUploadMessage] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
    setUploadResults([])
    setUploadMessage('')
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadCVs = async () => {
    if (selectedFiles.length === 0) return
    setUploading(true)
    setUploadResults([])
    setUploadMessage('')

    const formData = new FormData()
    selectedFiles.forEach(file => formData.append('files', file))
    if (jobReference) formData.append('job_id', jobReference)

    try {
      const res = await fetch('/api/cvs/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setUploadResults(data.results || [])
        setUploadMessage(`${data.successCount} CV(s) uploaded to HRFlow source`)
        setSelectedFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setUploadMessage(data.error || 'Upload failed')
      }
    } catch {
      setUploadMessage('Network error')
    } finally {
      setUploading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!jobReference) { setTestStatus('error'); setTestMessage('Please enter a job reference'); return }
    setLoading(true); setTestStatus('idle')
    try {
      const res = await fetch('/api/setup/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_reference: jobReference }) })
      const data = await res.json()
      if (res.ok) { setTestStatus('success'); setTestMessage(`Connected! Job: ${data.job?.name || jobReference}`) }
      else { setTestStatus('error'); setTestMessage(data.error || 'Connection failed') }
    } catch { setTestStatus('error'); setTestMessage('Network error') }
    finally { setLoading(false) }
  }

  const handleRunScoring = async () => {
    if (!jobReference) { setTestStatus('error'); setTestMessage('Please enter a job reference'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/scoring/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_reference: jobReference }) })
      const data = await res.json()
      if (res.ok) { localStorage.setItem('scoringResults', JSON.stringify(data)); localStorage.setItem('jobReference', jobReference); router.push('/results') }
      else { setTestStatus('error'); setTestMessage(data.error || 'Scoring failed') }
    } catch { setTestStatus('error'); setTestMessage('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">TooGoodToHire</h1>
          <p className="mt-2 text-muted-foreground">Upload CVs and run candidate scoring</p>
        </div>

        {/* CV Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CVs
            </CardTitle>
            <CardDescription>Upload CVs to your HRFlow source for parsing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.rtf,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to select CVs (PDF, DOC, DOCX, RTF, TXT)
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadMessage && (
              <div className={`flex items-center gap-2 rounded-md p-3 ${uploadResults.some(r => !r.success) ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{uploadMessage}</span>
              </div>
            )}

            {uploadResults.length > 0 && (
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {uploadResults.map((result, i) => (
                  <div key={i} className={`p-2 rounded ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className="font-medium">{result.success ? '✓' : '✗'} {result.filename}</span>
                    {result.message && <span className="ml-2 opacity-80">({result.message})</span>}
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleUploadCVs}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full"
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Upload {selectedFiles.length} CV(s) to HRFlow</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scoring Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Job Configuration</CardTitle>
            <CardDescription>API keys are loaded from environment variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="job-reference">Job Reference</Label>
              <Input id="job-reference" placeholder="e.g., job_abc123" value={jobReference} onChange={(e) => setJobReference(e.target.value)} />
              <p className="text-sm text-muted-foreground">The reference ID of the job to score candidates against</p>
            </div>
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 rounded-md p-3 ${testStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testStatus === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={handleTestConnection} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Test Connection
              </Button>
              <Button onClick={handleRunScoring} disabled={loading || !jobReference} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Run Scoring
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
