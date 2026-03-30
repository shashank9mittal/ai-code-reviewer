'use client'
import { useMemo, useEffect, useRef } from 'react'
import ReactCodeMirror, { EditorView } from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { go } from '@codemirror/lang-go'
import {
  Decoration,
  DecorationSet,
  StateField,
  StateEffect,
  RangeSetBuilder,
} from '@uiw/react-codemirror'
import type { Annotation } from '../types/review'

const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(239,68,68,0.15)',
  warning: 'rgba(245,158,11,0.15)',
  suggestion: 'rgba(59,130,246,0.15)',
}

const setDecorations = StateEffect.define<DecorationSet>()

const decorationField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setDecorations)) {
        deco = effect.value
      }
    }
    return deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

function buildDecorations(
  annotations: Annotation[],
  doc: { lines: number; line(n: number): { from: number; to: number } }
): DecorationSet {
  const sorted = [...annotations].sort((a, b) => a.line - b.line)
  const builder = new RangeSetBuilder<Decoration>()
  for (const ann of sorted) {
    if (ann.line < 1 || ann.line > doc.lines) continue
    const line = doc.line(ann.line)
    const color = SEVERITY_BG[ann.severity]
    builder.add(
      line.from,
      line.from,
      Decoration.line({ attributes: { style: `background-color: ${color}` } })
    )
  }
  return builder.finish()
}

interface CodeEditorProps {
  code: string
  onChange: (value: string) => void
  language?: string
  annotations?: Annotation[]
  isLoading?: boolean
}

export default function CodeEditor({
  code,
  onChange,
  language,
  annotations = [],
  isLoading = false,
}: CodeEditorProps) {
  const viewRef = useRef<EditorView | null>(null)

  const langExtension = useMemo(() => {
    switch (language) {
      case 'python':
        return python()
      case 'go':
        return go()
      case 'typescript':
        return javascript({ typescript: true })
      case 'javascript':
      default:
        return javascript()
    }
  }, [language])

  const extensions = useMemo(
    () => [langExtension, decorationField],
    [langExtension]
  )

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const deco = buildDecorations(annotations, view.state.doc)
    view.dispatch({ effects: setDecorations.of(deco) })
  }, [annotations])

  return (
    <div className="relative">
      <ReactCodeMirror
        value={code}
        onChange={onChange}
        theme={oneDark}
        extensions={extensions}
        basicSetup={{ lineNumbers: true }}
        minHeight="400px"
        onCreateEditor={(view) => {
          viewRef.current = view
        }}
      />
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 animate-pulse rounded bg-white/5" />
      )}
    </div>
  )
}
