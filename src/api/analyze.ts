import type { AnalysisResult } from '../types'

export async function analyzeVideo(file: File): Promise<AnalysisResult> {
  const formData = new FormData()
  formData.append('video', file)

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    const message =
      (error as { detail?: string } | null)?.detail ??
      'Analysis failed. Please try again.'
    throw new Error(message)
  }

  return response.json() as Promise<AnalysisResult>
}
