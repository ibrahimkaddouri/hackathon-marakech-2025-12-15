import { NextRequest, NextResponse } from 'next/server'

const HRFLOW_API_URL = 'https://api.hrflow.ai/v1'

interface ParsedCV {
  reference: string
  filename: string
  success: boolean
  message?: string
  profile_key?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const jobId = formData.get('job_id') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const apiKey = process.env.HRFLOW_API_KEY
    const userEmail = process.env.HRFLOW_USER_EMAIL
    const sourceKey = process.env.HRFLOW_SOURCE_KEY

    if (!apiKey || !userEmail || !sourceKey) {
      return NextResponse.json({ error: 'HRFlow credentials not configured' }, { status: 500 })
    }

    const results: ParsedCV[] = []

    for (const file of files) {
      // Generate unique reference for each CV
      const reference = `cv_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Prepare form data for HRFlow API
      const hrflowFormData = new FormData()
      hrflowFormData.append('source_key', sourceKey)
      hrflowFormData.append('reference', reference)

      // Add tags
      const tags = []
      if (jobId) {
        tags.push({ name: 'job_id', value: jobId })
      }
      tags.push({ name: 'uploaded_at', value: new Date().toISOString() })
      hrflowFormData.append('tags', JSON.stringify(tags))

      // Append the file
      hrflowFormData.append('file', file)

      try {
        const response = await fetch(`${HRFLOW_API_URL}/profile/parsing/file`, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'X-USER-EMAIL': userEmail,
          },
          body: hrflowFormData,
        })

        const data = await response.json()
        console.log('HRFlow response:', JSON.stringify(data, null, 2))

        // HRFlow returns code 200 or 201 for success, or message contains "success"
        const isSuccess = response.ok && (
          data.code === 200 ||
          data.code === 201 ||
          data.message?.toLowerCase().includes('success')
        )

        if (isSuccess) {
          results.push({
            reference,
            filename: file.name,
            success: true,
            message: data.message || 'Parsed successfully',
            profile_key: data.data?.profile?.key,
          })
        } else {
          results.push({
            reference,
            filename: file.name,
            success: false,
            message: data.message || 'Parsing failed',
          })
        }
      } catch (error) {
        results.push({
          reference,
          filename: file.name,
          success: false,
          message: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `${successCount} CV(s) uploaded successfully, ${failedCount} failed`,
      results,
      total: files.length,
      successCount,
      failedCount,
    })
  } catch (error) {
    console.error('CV upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
