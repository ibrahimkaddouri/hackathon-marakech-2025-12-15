import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface EvaluationResult {
  summary: string
  green_flags: string[]
  yellow_flags: string[]
  red_flags: string[]
  match_percentage: number
  match_explanation: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params
    const { transcript, job_description } = await request.json()
    if (!transcript) return NextResponse.json({ error: 'transcript required' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })

    const systemPrompt = `Tu es un expert en recrutement. Analyse ce transcript d'entretien et évalue le candidat.

Retourne un JSON avec exactement cette structure:
{
  "summary": "Résumé de 2-3 phrases sur la performance du candidat",
  "green_flags": ["Point positif 1", "Point positif 2", ...],
  "yellow_flags": ["Question à poser au candidat 1?", "Question à poser au candidat 2?", ...],
  "red_flags": ["Point négatif 1", "Point négatif 2", ...],
  "match_percentage": 75,
  "match_explanation": "Explication courte du score"
}

Règles:
- green_flags: compétences démontrées, expériences pertinentes, soft skills positifs
- yellow_flags: questions CONCRÈTES à poser au candidat lors des prochaines étapes pour clarifier des zones d'ombre (ex: "Pouvez-vous détailler votre rôle exact dans le projet X?", "Comment avez-vous géré le conflit avec votre manager?")
- red_flags: incohérences, manque d'expérience critique, signaux d'alerte
- match_percentage: 0-100 basé sur l'adéquation globale
- Sois objectif et factuel, base-toi uniquement sur ce qui est dit dans le transcript

IMPORTANT: Tu dois TOUJOURS fournir au moins 2 éléments dans chaque catégorie (green_flags, yellow_flags, red_flags). Aucun champ ne doit être vide. Même si le candidat est excellent, trouve des points à clarifier et des risques potentiels. Même si le candidat est faible, trouve des points positifs.`

    const userPrompt = job_description
      ? `Description du poste:\n${job_description}\n\nTranscript de l'entretien:\n${transcript}`
      : `Transcript de l'entretien:\n${transcript}`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI error:', error)
      return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 })
    }

    const evaluation: EvaluationResult = JSON.parse(content)

    // Validate and ensure all fields exist
    const validatedEvaluation: EvaluationResult = {
      summary: evaluation.summary || 'Evaluation completed',
      green_flags: evaluation.green_flags || [],
      yellow_flags: evaluation.yellow_flags || [],
      red_flags: evaluation.red_flags || [],
      match_percentage: Math.min(100, Math.max(0, evaluation.match_percentage || 50)),
      match_explanation: evaluation.match_explanation || 'Evaluation based on interview transcript',
    }

    return NextResponse.json({ success: true, evaluation: validatedEvaluation })
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
