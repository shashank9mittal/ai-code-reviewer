'use client'
import { useEffect, useState } from 'react'
import ReactCodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { go } from '@codemirror/lang-go'
import { EditorState } from '@uiw/react-codemirror'
import type { Annotation } from '../types/review'

function langExtension(language: string) {
  switch (language) {
    case 'python': return python()
    case 'go': return go()
    case 'typescript': return javascript({ typescript: true })
    default: return javascript()
  }
}

interface RefactorPanelProps {
  annotation: Annotation
  originalCode: string
  language: string
  onClose: () => void
}

export default function RefactorPanel({
  annotation,
  originalCode,
  language,
  onClose,
}: RefactorPanelProps) {
  const [fixedCode, setFixedCode] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRefactor() {
      try {
        const res = await fetch('/api/refactor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: originalCode, annotation, language }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error ?? `Request failed with status ${res.status}`)
        }
        const data = await res.json()
        setFixedCode(data.fixedCode)
        setExplanation(data.explanation)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRefactor()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ext = [langExtension(language), EditorState.readOnly.of(true)]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-5xl flex-col gap-4 rounded-xl bg-[#111] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Refactor suggestion</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-950/40 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        {!isLoading && !error && (
          <>
            {explanation && (
              <p className="text-xs text-gray-400">{explanation}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div className="flex flex-col overflow-hidden rounded-lg">
                <div
                  className="px-3 py-1.5 text-xs font-semibold text-red-300"
                  style={{ backgroundColor: '#ef444420' }}
                >
                  Before
                </div>
                <ReactCodeMirror
                  value={originalCode}
                  theme={oneDark}
                  extensions={ext}
                  editable={false}
                  basicSetup={{ lineNumbers: true }}
                  minHeight="300px"
                />
              </div>

              {/* After */}
              <div className="flex flex-col overflow-hidden rounded-lg">
                <div
                  className="px-3 py-1.5 text-xs font-semibold text-green-300"
                  style={{ backgroundColor: '#22c55e20' }}
                >
                  After
                </div>
                <ReactCodeMirror
                  value={fixedCode ?? ''}
                  theme={oneDark}
                  extensions={ext}
                  editable={false}
                  basicSetup={{ lineNumbers: true }}
                  minHeight="300px"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
