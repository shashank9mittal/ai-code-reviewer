import { Severity } from '../types/review'

const config: Record<Severity, { bg: string; label: string }> = {
  critical: { bg: 'bg-[#ef4444]', label: 'Critical' },
  warning: { bg: 'bg-[#f59e0b]', label: 'Warning' },
  suggestion: { bg: 'bg-[#3b82f6]', label: 'Suggestion' },
}

export default function SeverityBadge({
  severity,
  count,
}: {
  severity: Severity
  count?: number
}) {
  const { bg, label } = config[severity]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${bg}`}
    >
      {label}
      {count !== undefined && (
        <span className="rounded-full bg-white/30 px-1.5 py-0 font-semibold">
          {count}
        </span>
      )}
    </span>
  )
}
