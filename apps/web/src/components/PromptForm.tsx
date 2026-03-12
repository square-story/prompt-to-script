import { useMemo, useState } from 'react'
import { X, Plus, Upload } from 'lucide-react'

interface PromptFormProps {
  onSubmit: (formData: FormData, prompt: string) => void
  isLoading: boolean
}

const isValidUrl = (value: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const PromptForm = ({ onSubmit, isLoading }: PromptFormProps) => {
  const [prompt, setPrompt] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urls, setUrls] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const promptError = useMemo(() => {
    const len = prompt.trim().length
    if (len === 0) return null
    if (len < 10) return 'Prompt must be at least 10 characters'
    if (len > 2000) return 'Prompt must be at most 2000 characters'
    return null
  }, [prompt])

  const canSubmit = !isLoading && !promptError && prompt.trim().length >= 10

  const addUrl = () => {
    const value = urlInput.trim()
    if (!value) return
    if (urls.length >= 5) return
    if (!isValidUrl(value)) return
    if (urls.includes(value)) {
      setUrlInput('')
      return
    }
    setUrls((prev) => [...prev, value])
    setUrlInput('')
  }

  const removeUrl = (value: string) => {
    setUrls((prev) => prev.filter((u) => u !== value))
  }

  const onPickFile = (picked: File | null) => {
    if (!picked) return
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) return
    if (picked.size > 20 * 1024 * 1024) return
    setFile(picked)
  }

  const submit = () => {
    if (!canSubmit) return

    const formData = new FormData()
    formData.set('prompt', prompt.trim())
    formData.set('referenceUrls', JSON.stringify(urls))
    if (file) {
      formData.set('file', file)
    }

    onSubmit(formData, prompt.trim())
  }

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-5">
        <div className="text-sm font-medium text-text-primary">Topic prompt</div>
        <div className="mt-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question or describe a topic you want a video script about…"
            className="min-h-[140px] w-full resize-none rounded-lg border border-border bg-bg p-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <div className={promptError ? 'text-error' : 'text-text-muted'}>{promptError ?? 'Min 10, max 2000 characters'}</div>
          <div className="text-text-muted">{prompt.trim().length}/2000</div>
        </div>
      </div>

      <div className="mb-5">
        <div className="text-sm font-medium text-text-primary">Reference URLs (optional)</div>
        <div className="mt-2 flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isLoading}
            placeholder="https://example.com/article"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUrl()
              }
            }}
          />
          <button
            type="button"
            disabled={isLoading || urls.length >= 5 || !isValidUrl(urlInput.trim())}
            onClick={addUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary hover:border-accent disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add URL
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {urls.map((u) => (
            <div key={u} className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs text-text-primary">
              <span className="max-w-[420px] truncate">{u}</span>
              <button type="button" disabled={isLoading} onClick={() => removeUrl(u)} className="opacity-80 hover:opacity-100 disabled:opacity-60">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="text-xs text-text-muted self-center">({urls.length}/5)</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-text-primary">PDF (optional)</div>
        <div
          className={[
            'mt-2 rounded-lg border border-dashed p-4',
            dragOver ? 'border-accent bg-bg/60' : 'border-border bg-bg',
            isLoading ? 'opacity-60' : '',
          ].join(' ')}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!isLoading) setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!isLoading) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (isLoading) return
            const dropped = e.dataTransfer.files?.[0]
            onPickFile(dropped ?? null)
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Upload className="h-4 w-4 text-text-muted" />
              <div className="text-sm text-text-muted">
                Drag & drop a PDF (max 20MB) or{' '}
                <label className="cursor-pointer text-text-primary underline underline-offset-4">
                  browse
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={isLoading}
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            {file ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                <span className="max-w-[220px] truncate">{file.name}</span>
                <button type="button" disabled={isLoading} onClick={() => setFile(null)} className="opacity-80 hover:opacity-100 disabled:opacity-60">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
      >
        {isLoading ? 'Researching...' : 'Research & Generate Script'}
      </button>
    </div>
  )
}

