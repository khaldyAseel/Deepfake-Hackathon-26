export type AppPhase = 'idle' | 'uploaded' | 'analyzing' | 'result'

export type ResultCategory = 'fake' | 'suspicious' | 'live'

export interface MetricScore {
  label: string
  value: number
  icon?: string
}

export interface RawSummary {
  frames_analyzed: number
  max_fake_score: number
  mean_fake_score: number
}

export interface ProblematicFrame {
  frameIndex: number
  fakeScore: number
  timestampSeconds: number
  imageUrl: string
}

export interface AnalysisResult {
  score: number
  category: ResultCategory
  metrics: MetricScore[]
  raw_summary?: RawSummary
  problematic_frames?: ProblematicFrame[]
}

export const ANALYSIS_STEPS = [
  'Extracting facial movement patterns…',
  'Checking eye blinking consistency…',
  'Analyzing mouth and audio synchronization…',
  'Scanning for deepfake artifacts…',
  'Calculating liveness score…',
] as const

export const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
  'video/x-msvideo': ['.avi'],
}

export const METRIC_LABELS = [
  'Face consistency',
  'Blink behavior',
  'Head movement',
  'Audio-video sync',
  'Artifact risk',
] as const
