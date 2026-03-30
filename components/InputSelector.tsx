'use client'
import { useState, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import CodeEditor from './CodeEditor'
import LoadingDots from './LoadingDots'

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'java',
  'cpp',
  'csharp',
]

const EXT_TO_LANG: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.cpp': 'cpp',
  '.cs': 'csharp',
}

interface InputSelectorProps {
  onCodeReady: (code: string, filename?: string, language?: string) => void
  isLoading?: boolean
}

export default function InputSelector({ onCodeReady, isLoading = false }: InputSelectorProps) {
  // Tab 1 — Paste Code
  const [pasteCode, setPasteCode] = useState('')
  const [pasteLanguage, setPasteLanguage] = useState('javascript')

  // Tab 2 — Upload File
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tab 3 — GitHub PR
  const [prUrl, setPrUrl] = useState('')
  const [prLoading, setPrLoading] = useState(false)
  const [prError, setPrError] = useState('')

  // --- Tab 2 helpers ---
  function readFile(file: File) {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    const language = EXT_TO_LANG[ext] ?? 'plaintext'
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onCodeReady(content, file.name, language)
    }
    reader.readAsText(file)
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  // --- Tab 3 helper ---
  async function handleFetchPR() {
    setPrError('')
    setPrLoading(true)
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: prUrl }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? `Request failed with status ${res.status}`)
      }
      const data = await res.json()
      onCodeReady(data.code, data.filename, data.language)
    } catch (err) {
      setPrError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPrLoading(false)
    }
  }

  return (
    <Tabs defaultValue="paste">
      <TabsList>
        <TabsTrigger value="paste">Paste Code</TabsTrigger>
        <TabsTrigger value="upload">Upload File</TabsTrigger>
        <TabsTrigger value="github">GitHub PR</TabsTrigger>
      </TabsList>

      {/* Tab 1 — Paste Code */}
      <TabsContent value="paste">
        <div className="space-y-3 pt-3">
          <select
            value={pasteLanguage}
            onChange={(e) => setPasteLanguage(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <CodeEditor
            code={pasteCode}
            onChange={setPasteCode}
            language={pasteLanguage}
          />

          <Button
            onClick={() => onCodeReady(pasteCode, undefined, pasteLanguage)}
            disabled={!pasteCode.trim() || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                Reviewing <LoadingDots />
              </span>
            ) : (
              'Review Code'
            )}
          </Button>
        </div>
      </TabsContent>

      {/* Tab 2 — Upload File */}
      <TabsContent value="upload">
        <div
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/30 hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <p className="text-sm text-muted-foreground">
            Drop your file here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            .js .jsx .ts .tsx .py .go .rs .java .cpp .cs
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".js,.jsx,.ts,.tsx,.py,.go,.rs,.java,.cpp,.cs"
          className="hidden"
          onChange={handleFileInput}
        />
      </TabsContent>

      {/* Tab 3 — GitHub PR */}
      <TabsContent value="github">
        <div className="space-y-3 pt-3">
          <input
            type="text"
            value={prUrl}
            onChange={(e) => { setPrUrl(e.target.value); setPrError('') }}
            placeholder="https://github.com/owner/repo/pull/123"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <Button onClick={handleFetchPR} disabled={!prUrl.trim() || prLoading}>
            {prLoading ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="size-3 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Fetching…
              </span>
            ) : (
              'Fetch PR'
            )}
          </Button>

          {prError && (
            <p className="text-xs text-red-500">{prError}</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
