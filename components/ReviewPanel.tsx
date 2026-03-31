import { ReviewResult, Severity } from '../types/review'
import SeverityBadge from './SeverityBadge'

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

const FILTER_CONFIG: {
  severity: Severity
  label: string
  activeBg: string
  border: string
  text: string
}[] = [
  {
    severity: 'critical',
    label: 'Critical',
    activeBg: 'bg-[#ef4444]',
    border: 'border-[#ef4444]',
    text: 'text-[#ef4444]',
  },
  {
    severity: 'warning',
    label: 'Warning',
    activeBg: 'bg-[#f59e0b]',
    border: 'border-[#f59e0b]',
    text: 'text-[#f59e0b]',
  },
  {
    severity: 'suggestion',
    label: 'Suggestion',
    activeBg: 'bg-[#3b82f6]',
    border: 'border-[#3b82f6]',
    text: 'text-[#3b82f6]',
  },
]

export default function ReviewPanel({
  result,
  isLoading,
  visibleSeverities,
  onToggleSeverity,
}: {
  result: ReviewResult | null
  isLoading: boolean
  visibleSeverities: Set<Severity>
  onToggleSeverity: (severity: Severity) => void
}) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-6 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
      </div>
    )
  }

  if (!result) return null

  const visibleAnnotations = result.annotations.filter((a) =>
    visibleSeverities.has(a.severity)
  )

  return (
    <div className="animate-fade-in space-y-6 p-4">
      {/* Score */}
      <div className="flex items-baseline gap-1">
        <span className={`text-5xl font-bold ${scoreColor(result.score)}`}>
          {result.score}
        </span>
        <span className="text-lg text-gray-500">/ 100</span>
      </div>

      {/* Severity filter toggles */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CONFIG.map(({ severity, label, activeBg, border, text }) => {
          const active = visibleSeverities.has(severity)
          const count =
            severity === 'critical'
              ? result.stats.critical
              : severity === 'warning'
                ? result.stats.warning
                : result.stats.suggestion
          return (
            <button
              key={severity}
              onClick={() => onToggleSeverity(severity)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                active
                  ? `${activeBg} border-transparent text-white`
                  : `bg-transparent ${border} ${text}`
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0 font-semibold ${
                  active ? 'bg-white/30' : 'bg-current/10'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Summary */}
      <div>
        <h2 className="mb-1 text-sm font-semibold text-gray-700">Summary</h2>
        <p className="text-sm text-gray-600">{result.summary}</p>
      </div>

      {/* Annotations */}
      {result.annotations.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Annotations
          </h2>
          {visibleAnnotations.length === 0 ? (
            <p className="text-xs text-gray-500">
              No annotations match the active filters.
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleAnnotations.map((annotation, i) => (
                <li
                  key={i}
                  className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">
                      L{annotation.line}
                    </span>
                    <SeverityBadge severity={annotation.severity} />
                  </div>
                  <p className="mt-1 text-gray-700">{annotation.message}</p>
                  {annotation.suggestion && (
                    <p className="mt-1 text-gray-500 italic">
                      {annotation.suggestion}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
