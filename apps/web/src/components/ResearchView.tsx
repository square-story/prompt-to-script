import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react'
import { ResearchOutput } from '@/types/pipeline'

interface ResearchViewProps {
  research: ResearchOutput
}

const confidenceStyles: Record<'high' | 'medium' | 'low', string> = {
  high: 'border-success text-success',
  medium: 'border-warning text-warning',
  low: 'border-error text-error',
}

export const ResearchView = ({ research }: ResearchViewProps) => {
  const [open, setOpen] = useState({
    summary: true,
    findings: true,
    stats: true,
    controversies: true,
    verified: true,
  })

  const hasControversies = research.controversies.length > 0

  const copyVerified = async () => {
    await navigator.clipboard.writeText(research.verifiedFactsSummary)
  }

  const findings = useMemo(() => research.keyFindings ?? [], [research.keyFindings])

  const Section = (props: { id: keyof typeof open; title: string; children: React.ReactNode; right?: React.ReactNode }) => (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((prev) => ({ ...prev, [props.id]: !prev[props.id] }))}
      >
        <div className="flex items-center gap-2">
          {open[props.id] ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
          <div className="text-sm font-medium text-text-primary">{props.title}</div>
        </div>
        {props.right}
      </button>
      {open[props.id] ? <div className="border-t border-border px-4 py-4">{props.children}</div> : null}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text-primary">Research</div>
        <button
          type="button"
          onClick={copyVerified}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary hover:border-accent"
        >
          <Copy className="h-4 w-4" />
          Copy verified facts
        </button>
      </div>

      <Section id="summary" title="Topic Summary">
        <p className="text-sm leading-6 text-text-primary">{research.topicSummary}</p>
      </Section>

      <Section id="findings" title={`Key Findings (${findings.length})`}>
        <div className="space-y-3">
          {findings.map((f, idx) => (
            <div key={`${f.claim}-${idx}`} className="rounded-lg border border-border bg-bg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-text-primary">{f.claim}</div>
                <div className={['shrink-0 rounded-full border px-2 py-0.5 text-[11px]', confidenceStyles[f.confidence]].join(' ')}>
                  {f.confidence.toUpperCase()} confidence
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-text-muted">{f.explanation}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {f.citations.map((c) => (
                  <a
                    key={c.url}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-primary hover:border-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
                    <span className="truncate max-w-[220px]">{c.domain}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="stats" title={`Statistics (${research.statistics.length})`}>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg">
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-text-muted">Stat</th>
                <th className="px-3 py-2 text-xs font-medium text-text-muted">Source</th>
              </tr>
            </thead>
            <tbody>
              {research.statistics.map((s, idx) => (
                <tr key={`${s.stat}-${idx}`} className="border-t border-border">
                  <td className="px-3 py-2 text-text-primary">{s.stat}</td>
                  <td className="px-3 py-2 text-text-muted">{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="controversies" title="Controversies" right={!hasControversies ? <span className="text-xs text-text-muted pr-1">None</span> : null}>
        {hasControversies ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-primary">
            {research.controversies.map((c, idx) => (
              <li key={`${c}-${idx}`}>{c}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-text-muted">No major controversies were identified in the research output.</div>
        )}
      </Section>

      <Section id="verified" title='Verified Facts Summary' right={<span className="text-xs text-text-muted pr-1">This grounded your script</span>}>
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm leading-6 text-text-primary">{research.verifiedFactsSummary}</p>
        </div>
      </Section>
    </div>
  )
}

