import { motion } from 'framer-motion'
import { AlertTriangle, Clock, Hash } from 'lucide-react'
import type { ProblematicFrame } from '../types'

interface ProblematicFramesSectionProps {
  frames: ProblematicFrame[]
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-emerald-400'
}

function getScoreRing(score: number): string {
  if (score >= 70) return 'ring-red-500/40'
  if (score >= 40) return 'ring-amber-500/40'
  return 'ring-emerald-500/40'
}

export function ProblematicFramesSection({
  frames,
}: ProblematicFramesSectionProps) {
  if (frames.length === 0) return null

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h3 className="font-display text-lg font-semibold text-white">
          Most Problematic Frames
        </h3>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
          {frames.length} found
        </span>
      </div>

      <div
        className={`grid gap-4 ${
          frames.length === 1
            ? 'grid-cols-1 max-w-sm mx-auto'
            : frames.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {frames.map((frame, index) => (
          <motion.div
            key={`${frame.frameIndex}-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + index * 0.1 }}
            className={`overflow-hidden rounded-xl bg-slate-800/50 ring-1 ${getScoreRing(frame.fakeScore)}`}
          >
            <div className="relative aspect-square overflow-hidden bg-black">
              <img
                src={frame.imageUrl}
                alt={`Problematic frame ${frame.frameIndex + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                #{index + 1}
              </div>
            </div>

            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Frame {frame.frameIndex + 1}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(frame.timestampSeconds)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Fake score</span>
                <span
                  className={`font-mono text-sm font-semibold ${getScoreColor(frame.fakeScore)}`}
                >
                  {frame.fakeScore}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
