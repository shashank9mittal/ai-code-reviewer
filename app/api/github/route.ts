import { Octokit } from '@octokit/rest'
import { detectLanguage } from '@/lib/anthropic'

const SUPPORTED_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.cs',
])

const PR_URL_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/

export async function POST(request: Request) {
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { url } = body ?? {}
  const match = url ? PR_URL_RE.exec(url) : null

  if (!match) {
    return Response.json({ error: 'Invalid GitHub PR URL' }, { status: 400 })
  }

  const [, owner, repo, pullStr] = match
  const pull_number = parseInt(pullStr, 10)

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    const [, filesRes] = await Promise.all([
      octokit.pulls.get({ owner, repo, pull_number }),
      octokit.pulls.listFiles({ owner, repo, pull_number, per_page: 100 }),
    ])

    const filtered = filesRes.data.filter((f) => {
      const ext = f.filename.slice(f.filename.lastIndexOf('.')).toLowerCase()
      return SUPPORTED_EXTS.has(ext)
    })

    const contents = await Promise.all(
      filtered.map(async (f) => {
        const res = await fetch(f.raw_url)
        if (!res.ok) return `// ===== ${f.filename} =====\n// (failed to fetch)\n`
        const text = await res.text()
        return `// ===== ${f.filename} =====\n${text}`
      })
    )

    const code = contents.join('\n\n')
    const firstFile = filtered[0]?.filename ?? ''
    const language = firstFile ? detectLanguage(firstFile) : 'plaintext'

    return Response.json({ code, language, fileCount: filtered.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
