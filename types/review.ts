export type Severity = 'critical' | 'warning' | 'suggestion'

export interface Annotation {
  line: number
  severity: Severity
  message: string
  suggestion?: string
}

export interface ReviewResult {
  annotations: Annotation[]
  summary: string
  score: number
  stats: {
    critical: number
    warning: number
    suggestion: number
  }
}

export interface ReviewRequest {
  code: string
  language?: string
  filename?: string
}
