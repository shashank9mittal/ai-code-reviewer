import { ReviewResult } from '../types/review'
import SeverityBadge from './SeverityBadge'

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

export default function ReviewPanel({
  result,
  isLoading,
}: {
  result: ReviewResult | null
  isLoading: boolean
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

  return (
    <div className="animate-fade-in space-y-6 p-4">
      {/* Score */}
      <div className="flex items-baseline gap-1">
        <span className={`text-5xl font-bold ${scoreColor(result.score)}`}>
          {result.score}
        </span>
        <span className="text-lg text-gray-500">/ 100</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <SeverityBadge severity="critical" count={result.stats.critical} />
        <SeverityBadge severity="warning" count={result.stats.warning} />
        <SeverityBadge severity="suggestion" count={result.stats.suggestion} />
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
          <ul className="space-y-2">
            {result.annotations.map((annotation, i) => (
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
        </div>
      )}
    </div>
  )
}
