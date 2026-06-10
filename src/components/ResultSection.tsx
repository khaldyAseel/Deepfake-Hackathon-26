import { motion } from 'framer-motion'
import {
  Eye,
  Headphones,
  Move3d,
  ScanFace,
  ShieldAlert,
  RotateCcw,
  TrendingUp,
} from 'lucide-react'
import type { AnalysisResult, ResultCategory } from '../types'
import {
  getCategoryDescription,
  getCategoryLabel,
} from '../utils/analysis'

interface ResultSectionProps {
  result: AnalysisResult
  onReset: () => void
}

const categoryStyles: Record<
  ResultCategory,
  {
    badge: string
    score: string
    bar: string
    marker: string
    glow: string
    icon: typeof ShieldAlert
  }
> = {
  fake: {
    badge: 'bg-red-500/20 text-red-300 ring-red-500/30',
    score: 'text-red-400',
    bar: 'from-red-600 via-red-500 to-orange-500',
    marker: 'border-red-400 bg-red-500 shadow-red-500/50',
    glow: 'shadow-glow-red',
    icon: ShieldAlert,
  },
  suspicious: {
    badge: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
    score: 'text-amber-400',
    bar: 'from-amber-600 via-orange-500 to-yellow-500',
    marker: 'border-amber-400 bg-amber-500 shadow-amber-500/50',
    glow: 'shadow-glow-amber',
    icon: TrendingUp,
  },
  live: {
    badge: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
    score: 'text-emerald-400',
    bar: 'from-emerald-600 via-green-500 to-cyan-500',
    marker: 'border-emerald-400 bg-emerald-500 shadow-emerald-500/50',
    glow: 'shadow-glow-emerald',
    icon: ScanFace,
  },
}

const metricIcons = [ScanFace, Eye, Move3d, Headphones, ShieldAlert]

function getMetricColor(value: number): string {
  if (value <= 30) return 'text-red-400'
  if (value <= 60) return 'text-amber-400'
  return 'text-emerald-400'
}

function getMetricBarColor(value: number): string {
  if (value <= 30) return 'bg-red-500'
  if (value <= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function ResultSection({ result, onReset }: ResultSectionProps) {
  const { score, category, metrics } = result
  const styles = categoryStyles[category]
  const Icon = styles.icon

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-3xl"
    >
      <div className={`glass-card overflow-hidden ${styles.glow}`}>
        <div className="border-b border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-800/40 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Liveness Score
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className={`font-display text-5xl font-bold sm:text-6xl ${styles.score}`}
                >
                  {score}
                </motion.span>
                <span className="text-2xl text-slate-500">/100</span>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ${styles.badge}`}
            >
              <Icon className="h-4 w-4" />
              {getCategoryLabel(category)}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            {getCategoryDescription(category)}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wider">
            <span className="text-red-400">Fake</span>
            <span className="text-emerald-400">Live</span>
          </div>

          <div className="relative h-4 rounded-full bg-gradient-to-r from-red-900/60 via-amber-900/40 to-emerald-900/60 ring-1 ring-white/10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 via-amber-500/20 to-emerald-500/20" />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r opacity-40 ${styles.bar}`}
            />
            <motion.div
              initial={{ left: '0%' }}
              animate={{ left: `calc(${score}% - 10px)` }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 shadow-lg ${styles.marker}`}
            />
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-slate-500 sm:text-xs">
            <span>0–30: Likely Fake</span>
            <span>31–60: Suspicious</span>
            <span>61–100: Likely Live</span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, i) => {
              const MetricIcon = metricIcons[i] ?? ScanFace
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-colors hover:bg-slate-800/80"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MetricIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">{metric.label}</span>
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold ${getMetricColor(metric.value)}`}
                    >
                      {metric.value}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.08 }}
                      className={`h-full rounded-full ${getMetricBarColor(metric.value)}`}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-center text-xs text-slate-500 sm:text-left">
              Demo only — results are simulated until connected to the detection
              model.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset & Upload Another
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
