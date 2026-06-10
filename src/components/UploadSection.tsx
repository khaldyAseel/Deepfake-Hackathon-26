import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  Film,
  FileVideo,
  HardDrive,
  Play,
  AlertCircle,
} from 'lucide-react'
import { ACCEPTED_VIDEO_TYPES } from '../types'
import { formatFileSize } from '../utils/analysis'

interface UploadSectionProps {
  onFileSelected: (file: File, previewUrl: string) => void
  onAnalyze: () => void
  selectedFile: File | null
  previewUrl: string | null
  disabled?: boolean
}

export function UploadSection({
  onFileSelected,
  onAnalyze,
  selectedFile,
  previewUrl,
  disabled = false,
}: UploadSectionProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { errors: readonly { message: string }[] }[]) => {
      setError(null)
      if (rejectedFiles.length > 0) {
        setError('Please upload a valid video file (MP4, MOV, WebM, or AVI).')
        return
      }
      const file = acceptedFiles[0]
      if (file) {
        const url = URL.createObjectURL(file)
        onFileSelected(file, url)
      }
    },
    [onFileSelected],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_VIDEO_TYPES,
      maxFiles: 1,
      disabled: disabled || !!selectedFile,
    })

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h2 className="mb-4 text-center font-display text-xl font-semibold text-white sm:text-2xl">
          Upload Video
        </h2>

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <div
                {...getRootProps()}
                className={`
                  group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed
                  p-10 text-center transition-all duration-300 sm:p-14
                  ${
                    isDragReject
                      ? 'border-red-500/50 bg-red-500/5'
                      : isDragActive
                        ? 'border-cyan-400/60 bg-cyan-500/10 shadow-glow-cyan'
                        : 'border-slate-600/50 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-800/50'
                  }
                `}
              >
                <input {...getInputProps()} />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

                <motion.div
                  animate={{ y: isDragActive ? -4 : 0 }}
                  className="relative flex flex-col items-center gap-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-white/10">
                    <Upload className="h-8 w-8 text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-base font-medium text-white sm:text-lg">
                      Drag & drop your video here or click to browse
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Supports MP4, MOV, WebM, AVI
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Film className="h-3.5 w-3.5" />
                    Max recommended: 100 MB demo clip
                  </div>
                </motion.div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center justify-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card overflow-hidden p-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                {previewUrl && (
                  <div className="relative overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                    <video
                      src={previewUrl}
                      controls
                      className="aspect-video w-full object-contain"
                      playsInline
                    />
                  </div>
                )}

                <div className="flex flex-col justify-center gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <FileVideo className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          File name
                        </p>
                        <p className="truncate font-medium text-white">
                          {selectedFile.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          File size
                        </p>
                        <p className="font-medium text-white">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAnalyze}
                    disabled={disabled}
                    className="btn-primary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    Analyze Video
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  )
}

export function useRevokePreview(previewUrl: string | null) {
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])
}
