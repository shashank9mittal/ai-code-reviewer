import { ReviewResult } from '../types/review'

export function parseStreamedJSON(
  chunk: string,
  buffer: string
): { buffer: string; result: ReviewResult | null } {
  if (!chunk || !chunk.trim()) {
    return { buffer, result: null }
  }

  const updatedBuffer = buffer + chunk

  if (updatedBuffer.length > 50000) {
    return { buffer: '', result: null }
  }

  try {
    const result = JSON.parse(updatedBuffer) as ReviewResult
    return { buffer: '', result }
  } catch {
    return { buffer: updatedBuffer, result: null }
  }
}
