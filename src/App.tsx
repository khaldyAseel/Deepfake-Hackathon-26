import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HeroSection } from './components/HeroSection'
import {
  UploadSection,
  useRevokePreview,
} from './components/UploadSection'
import { AnalysisProgress } from './components/AnalysisProgress'
import { ResultSection } from './components/ResultSection'
import {
  BackgroundEffects,
  DisclaimerBanner,
  Footer,
} from './components/Layout'
import type { AnalysisResult, AppPhase } from './types'
import { generateMockResult } from './utils/analysis'

function App() {
  const [phase, setPhase] = useState<AppPhase>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  useRevokePreview(previewUrl)

  const handleFileSelected = useCallback((file: File, url: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(url)
    setPhase('uploaded')
    setResult(null)
  }, [previewUrl])

  const handleAnalyze = useCallback(() => {
    setPhase('analyzing')
  }, [])

  const handleAnalysisComplete = useCallback(() => {
    const mockResult = generateMockResult()
    setResult(mockResult)
    setPhase('result')
  }, [])

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setPhase('idle')
  }, [previewUrl])

  const showUpload = phase === 'idle' || phase === 'uploaded'
  const isAnalyzing = phase === 'analyzing'
  const showResult = phase === 'result' && result

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundEffects />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <DisclaimerBanner />
        <HeroSection />

        <div className="mt-12 flex flex-col items-center gap-8">
          <AnimatePresence mode="wait">
            {showUpload && (
              <UploadSection
                key="upload"
                onFileSelected={handleFileSelected}
                onAnalyze={handleAnalyze}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                disabled={isAnalyzing}
              />
            )}

            {isAnalyzing && (
              <AnalysisProgress
                key="analysis"
                onComplete={handleAnalysisComplete}
              />
            )}

            {showResult && (
              <ResultSection key="result" result={result} onReset={handleReset} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
