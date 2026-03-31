import Anthropic from '@anthropic-ai/sdk'
import type { Annotation } from '@/types/review'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert code refactoring assistant. Given a code snippet and a specific issue, return ONLY a JSON object with this exact structure:
{
  fixedCode: string (the corrected version of the ENTIRE code snippet),
  explanation: string (one sentence explaining what you changed and why)
}
Return ONLY valid JSON. No markdown, no backticks, no explanation.`

export async function POST(request: Request) {
  let body: { code?: string; annotation?: Annotation; language?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { code, annotation, language } = body ?? {}
  if (!code || !annotation) {
    return Response.json({ error: 'code and annotation are required' }, { status: 400 })
  }

  const userMessage = `Fix this issue in the code:
Issue: ${annotation.message} on line ${annotation.line}
Severity: ${annotation.severity}

Code:
\`\`\`${language ?? ''}
${code}
\`\`\``

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text)
    return Response.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
