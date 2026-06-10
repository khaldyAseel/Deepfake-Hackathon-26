import type { AnalysisResult, ResultCategory } from '../types'
import { METRIC_LABELS } from '../types'

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function getResultCategory(score: number): ResultCategory {
  if (score <= 30) return 'fake'
  if (score <= 60) return 'suspicious'
  return 'live'
}

export function getCategoryLabel(category: ResultCategory): string {
  switch (category) {
    case 'fake':
      return 'Likely Fake'
    case 'suspicious':
      return 'Suspicious / Needs Review'
    case 'live':
      return 'Likely Live'
  }
}

export function getCategoryDescription(category: ResultCategory): string {
  switch (category) {
    case 'fake':
      return 'Multiple indicators suggest this video may be manipulated or synthetic.'
    case 'suspicious':
      return 'Some signals are inconsistent. Manual review is recommended.'
    case 'live':
      return 'Facial dynamics and sync patterns align with a genuine live recording.'
  }
}

export function generateMockResult(): AnalysisResult {
  const score = Math.floor(Math.random() * 101)
  const category = getResultCategory(score)

  const metrics = METRIC_LABELS.map((label) => {
    const variance = Math.floor(Math.random() * 25) - 12
    const value = Math.min(100, Math.max(0, score + variance))
    return { label, value, icon: label }
  })

  return { score, category, metrics }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
