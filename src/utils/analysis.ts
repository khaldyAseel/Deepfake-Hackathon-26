import type { ResultCategory } from '../types'

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
