import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { UploadSection, useRevokePreview } from './components/UploadSection';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultSection } from './components/ResultSection';
import { BackgroundEffects, Footer } from './components/Layout';
import { analyzeVideo } from './api/analyze';
import type { AnalysisResult, AppPhase } from './types';

function App() {
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);

  useRevokePreview(previewUrl);

  const handleFileSelected = useCallback(
    (file: File, url: string) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(url);
      setPhase('uploaded');
      setResult(null);
      setError(null);
    },
    [previewUrl],
  );

  const handleAnalyze = useCallback(() => {
    if (!selectedFile) return;

    setError(null);
    setPhase('analyzing');
    analysisPromiseRef.current = analyzeVideo(selectedFile);
  }, [selectedFile]);

  const handleAnalysisComplete = useCallback(async () => {
    try {
      const analysisResult = await analysisPromiseRef.current;
      if (!analysisResult) {
        throw new Error('No analysis result received.');
      }
      setResult(analysisResult);
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
      setPhase('uploaded');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    analysisPromiseRef.current = null;
    setPhase('idle');
  }, [previewUrl]);

  const showUpload = phase === 'idle' || phase === 'uploaded';
  const isAnalyzing = phase === 'analyzing';
  const showResult = phase === 'result' && result;

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundEffects />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <HeroSection />

        <div className="mt-12 flex flex-col items-center gap-8">
          {error && showUpload && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

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
              <ResultSection
                key="result"
                result={result}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
