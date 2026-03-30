import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export function detectLanguage(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.cpp': 'cpp',
    '.cs': 'csharp',
  }
  return map[ext] ?? 'plaintext'
}
