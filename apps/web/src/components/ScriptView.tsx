import { useMemo, useState } from 'react'
import { Copy, Download, RotateCcw } from 'lucide-react'
import { ScriptOutput, ScriptSection } from '@/types/pipeline'

interface ScriptViewProps {
  script: ScriptOutput
}

const sectionAccent: string[] = ['border-accent', 'border-success', 'border-warning', 'border-accent', 'border-success', 'border-warning']

const countWords = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

const formatScript = (sections: ScriptSection[]): string =>
  sections
    .map((s) => `${s.label.toUpperCase()}\n${s.content.trim()}\n`)
    .join('\n')
    .trim()

export const ScriptView = ({ script }: ScriptViewProps) => {
  const originalByLabel = useMemo(() => {
    const map = new Map<string, string>()
    script.sections.forEach((s) => map.set(s.label, s.content))
    return map
  }, [script.sections])

  const [edited, setEdited] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    script.sections.forEach((s) => {
      initial[s.label] = s.content
    })
    return initial
  })

  const computedSections = useMemo(() => {
    return script.sections.map((s) => {
      const content = edited[s.label] ?? s.content
      return { ...s, content, wordCount: countWords(content) }
    })
  }, [edited, script.sections])

  const totalWords = computedSections.reduce((sum, s) => sum + s.wordCount, 0)

  const copyAll = async () => {
    await navigator.clipboard.writeText(formatScript(computedSections))
  }

  const downloadTxt = () => {
    const blob = new Blob([formatScript(computedSections)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'creeto-script.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text-primary">Script</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary hover:border-accent"
          >
            <Copy className="h-4 w-4" />
            Copy full script
          </button>
          <button
            type="button"
            onClick={downloadTxt}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary hover:border-accent"
          >
            <Download className="h-4 w-4" />
            Download .txt
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <div>
            <span className="text-text-primary font-medium">{totalWords}</span> words
          </div>
          <div className="h-3 w-px bg-border" />
          <div>
            <span className="text-text-primary font-medium">{Math.round(script.estimatedDurationSeconds)}</span> sec (estimated)
          </div>
          <div className="h-3 w-px bg-border" />
          <div>
            <span className="text-text-primary font-medium">{computedSections.length}</span> sections
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {computedSections.map((s, idx) => (
          <div key={s.label} className={['rounded-xl border border-border bg-surface', 'border-l-4', sectionAccent[idx] ?? 'border-accent'].join(' ')}>
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-text-primary">{s.label}</div>
                <div className="text-xs italic text-text-muted">{s.purpose}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-border bg-bg px-2 py-0.5 text-[11px] text-text-muted">{s.wordCount} words</div>
                <button
                  type="button"
                  onClick={() => {
                    const original = originalByLabel.get(s.label) ?? s.content
                    setEdited((prev) => ({ ...prev, [s.label]: original }))
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-2 py-1 text-xs text-text-primary hover:border-accent"
                  title="Reset section"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>

            <div className="border-t border-border px-4 py-4">
              <div
                contentEditable
                suppressContentEditableWarning
                spellCheck
                className="min-h-[88px] whitespace-pre-wrap rounded-lg border border-border bg-bg p-3 font-mono text-sm leading-6 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                onInput={(e) => {
                  const text = (e.currentTarget.textContent ?? '').replace(/\u00A0/g, ' ')
                  setEdited((prev) => ({ ...prev, [s.label]: text }))
                }}
              >
                {s.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

