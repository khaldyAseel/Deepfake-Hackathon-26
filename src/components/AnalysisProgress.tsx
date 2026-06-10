import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ScanLine } from 'lucide-react'
import { ANALYSIS_STEPS } from '../types'

interface AnalysisProgressProps {
  onComplete: () => void
}

const TOTAL_DURATION_MS = 4500
const STEP_INTERVAL_MS = TOTAL_DURATION_MS / ANALYSIS_STEPS.length

export function AnalysisProgress({ onComplete }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const startTime = Date.now()

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const nextProgress = Math.min(100, (elapsed / TOTAL_DURATION_MS) * 100)
      setProgress(nextProgress)

      if (nextProgress >= 100) {
        clearInterval(progressInterval)
        setTimeout(onComplete, 300)
      }
    }, 50)

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= ANALYSIS_STEPS.length - 1) {
          clearInterval(stepInterval)
          return prev
        }
        return prev + 1
      })
    }, STEP_INTERVAL_MS)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [onComplete])

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl"
    >
      <div className="glass-card p-8">
        <div className="mb-6 flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-6 w-6 text-cyan-400" />
          </motion.div>
          <h2 className="font-display text-xl font-semibold text-white">
            Analyzing Video
          </h2>
        </div>

        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="font-mono font-medium text-cyan-300">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ left: `${Math.max(0, progress - 10)}%` }}
          />
        </div>

        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-6 flex items-center gap-3 rounded-lg bg-slate-800/50 px-4 py-3"
        >
          <ScanLine className="h-4 w-4 shrink-0 text-violet-400" />
          <p className="text-sm text-slate-300">{ANALYSIS_STEPS[stepIndex]}</p>
        </motion.div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ANALYSIS_STEPS.map((step, i) => (
            <span
              key={step}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                i <= stepIndex
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
