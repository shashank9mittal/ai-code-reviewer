import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided code and return a JSON object with this exact structure:
{
  annotations: [{ line: number, severity: 'critical'|'warning'|'suggestion', message: string, suggestion?: string }],
  summary: string,
  score: number (0-100),
  stats: { critical: number, warning: number, suggestion: number }
}
Severity rules: critical = bugs/security/will break in production, warning = performance/bad practices/code smells, suggestion = style/readability/minor improvements.
Return ONLY valid JSON. No markdown, no backticks, no explanation.`

export async function POST(request: Request) {
  const body = await request.json()
  const { code, language, filename } = body

  if (!code) {
    return new Response(JSON.stringify({ error: 'No code provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userMessage = [
    filename ? `Filename: ${filename}` : null,
    language ? `Language: ${language}` : null,
    `\nCode:\n${code}`,
  ]
    .filter(Boolean)
    .join('\n')

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
