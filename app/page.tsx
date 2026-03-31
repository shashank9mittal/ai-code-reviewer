'use client'
import { useState } from 'react'
import { ReviewResult, Annotation, Severity } from '../types/review'
import InputSelector from '../components/InputSelector'
import ReviewPanel from '../components/ReviewPanel'
import CodeEditor from '../components/CodeEditor'
import { parseStreamedJSON } from '../lib/parser'

export default function Home() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [filename, setFilename] = useState<string | undefined>(undefined)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [visibleSeverities, setVisibleSeverities] = useState<Set<Severity>>(
    new Set(['critical', 'warning', 'suggestion'])
  )

  function handleToggleSeverity(severity: Severity) {
    setVisibleSeverities((prev) => {
      const next = new Set(prev)
      if (next.has(severity)) {
        next.delete(severity)
      } else {
        next.add(severity)
      }
      return next
    })
  }

  async function handleCodeReady(
    newCode: string,
    newFilename?: string,
    newLanguage?: string
  ) {
    setCode(newCode)
    setFilename(newFilename)
    setLanguage(newLanguage ?? 'javascript')
    setIsLoading(true)
    setError(null)
    setReviewResult(null)
    setAnnotations([])

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          language: newLanguage,
          filename: newFilename,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? `Request failed with status ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const parsed = parseStreamedJSON(chunk, buffer)
        buffer = parsed.buffer

        if (parsed.result) {
          setReviewResult(parsed.result)
          setAnnotations(parsed.result.annotations ?? [])
          setIsLoading(false)
          return
        }
      }

      // Stream ended without a valid parse — try the final buffer
      const final = parseStreamedJSON('', buffer)
      if (final.result) {
        setReviewResult(final.result)
        setAnnotations(final.result.annotations ?? [])
      } else {
        throw new Error('Failed to parse review response')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Navbar */}
      <header
        className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between px-6"
        style={{ backgroundColor: '#111' }}
      >
        <span className="text-sm font-semibold text-white">CodeSense</span>
        <span className="text-xs text-gray-500">AI-powered code review</span>
      </header>

      {/* Error banner */}
      {error && (
        <div className="fixed inset-x-0 top-12 z-40 flex items-center justify-between gap-3 bg-red-950/80 px-6 py-2 text-xs text-red-300 backdrop-blur-sm">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 rounded p-0.5 hover:bg-red-900/60"
            aria-label="Dismiss error"
          >
            <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>
      )}

      {/* Main */}
      <main className="pt-12">
        <div className="grid min-h-[calc(100vh-3rem)] lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4 overflow-y-auto border-r border-white/5 p-6">
            <InputSelector onCodeReady={handleCodeReady} isLoading={isLoading} />

            {code && (
              <div className="mt-2">
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  language={language}
                  annotations={annotations.filter((a) =>
                    visibleSeverities.has(a.severity)
                  )}
                  isLoading={isLoading}
                />
              </div>
            )}


          </div>

          {/* Right column */}
          <div className="overflow-y-auto p-6">
            {!reviewResult && !isLoading && (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-gray-600">
                  Submit code to see the review
                </p>
              </div>
            )}
            <ReviewPanel
              result={reviewResult}
              isLoading={isLoading}
              visibleSeverities={visibleSeverities}
              onToggleSeverity={handleToggleSeverity}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
