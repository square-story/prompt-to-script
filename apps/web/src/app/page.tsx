'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PromptForm } from '@/components/PromptForm'
import { ResearchView } from '@/components/ResearchView'
import { ScriptView } from '@/components/ScriptView'
import { runPipeline } from '@/lib/api'
import { PipelineResult } from '@/types/pipeline'

type Phase = 'idle' | 'loading' | 'results'

const loadingMessage = (elapsedMs: number): string => {
  const s = elapsedMs / 1000
  if (s < 5) return 'Reading your sources...'
  if (s < 20) return 'Researching with Perplexity...'
  if (s < 35) return 'Structuring research findings...'
  if (s < 50) return 'Writing your script with Claude...'
  return 'Almost done — finalising...'
}

const HomePage = () => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState<string>('')
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(Date.now())

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => await runPipeline(formData),
    onMutate: () => {
      setError(null)
      setResult(null)
      setPhase('loading')
      setStartAt(Date.now())
    },
    onSuccess: (data) => {
      setResult(data)
      setPhase('results')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong — try again'
      setError(message)
      setPhase('idle')
      setStartAt(null)
    },
  })

  useEffect(() => {
    if (phase !== 'loading') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [phase])

  const elapsedMs = useMemo(() => {
    if (!startAt) return 0
    return Math.max(0, now - startAt)
  }, [now, startAt])

  const onSubmit = (formData: FormData, prompt: string) => {
    setTopic(prompt)
    mutation.mutate(formData)
  }

  const startOver = () => {
    setPhase('idle')
    setResult(null)
    setError(null)
    setTopic('')
    setStartAt(null)
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {phase === 'results' && result ? (
          <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-text-muted">Topic</div>
                <div className="truncate text-sm font-medium text-text-primary">{topic}</div>
              </div>
              <button
                type="button"
                onClick={startOver}
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary hover:border-accent"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'idle' ? (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <div className="text-2xl font-semibold text-text-primary">Creeto AI Mini</div>
              <div className="mt-2 text-sm text-text-muted">Prompt → Research → Script, in one clean flow.</div>
            </div>

            <PromptForm onSubmit={onSubmit} isLoading={mutation.isPending} />

            {error ? (
              <div className="mt-4 w-full max-w-2xl rounded-lg border border-error bg-surface p-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <div className="mt-10 w-full max-w-2xl">
              <div className="text-sm font-semibold text-text-primary">How it works</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  { title: '1) Ingest', desc: 'We read your prompt, optional PDF, and URLs.' },
                  { title: '2) Research', desc: 'We research the topic and extract verified facts.' },
                  { title: '3) Script', desc: 'We write a structured 60–90s video script.' },
                ].map((s) => (
                  <div key={s.title} className="rounded-xl border border-border bg-surface p-4">
                    <div className="text-sm font-medium text-text-primary">{s.title}</div>
                    <div className="mt-2 text-sm text-text-muted">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {phase === 'loading' ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center">
            <div className="text-sm font-semibold text-text-primary">{loadingMessage(elapsedMs)}</div>
            <div className="mt-2 text-sm text-text-muted">Elapsed: {(elapsedMs / 1000).toFixed(1)}s</div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-bg">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
            </div>
            <div className="mt-6 text-xs text-text-muted">Please keep this tab open. This can take up to ~60 seconds.</div>
          </div>
        ) : null}

        {phase === 'results' && result ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ResearchView research={result.research} />
            </div>
            <div>
              <ScriptView script={result.script} />
              <div className="mt-4 text-xs text-text-muted">
                Generated in <span className="text-text-primary font-medium">{(result.processingTimeMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default HomePage

