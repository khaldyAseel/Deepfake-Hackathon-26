import { motion } from 'framer-motion'
import { Shield, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto max-w-3xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300 backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4" />
          Liveness Detection
        </motion.div>

        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
            LiveCheck AI
          </span>
        </h1>

        <p className="mt-4 text-lg text-slate-300 sm:text-xl">
          Detect whether a video is live, recorded, or manipulated using
          AI-powered liveness analysis.
        </p>

      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        {[
          { icon: Shield, label: 'Deepfake Detection' },
          { icon: Sparkles, label: 'Liveness Scoring' },
        ].map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="glass-card flex items-center gap-2 px-4 py-2 text-sm text-slate-300"
          >
            <Icon className="h-4 w-4 text-accent-cyan" />
            {label}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
