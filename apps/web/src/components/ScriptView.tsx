import { useMemo, useState } from 'react'
import { Copy, Download, RotateCcw, Video, User, Tv, Play, Image as ImageIcon, MessageSquare, AlertCircle, Music } from 'lucide-react'
import { VideoScript, VideoScene } from '@/types/pipeline'

interface ScriptViewProps {
  script: VideoScript
}

const formatScriptText = (script: VideoScript): string => {
  let output = `TITLE: ${script.title}\nTOPIC: ${script.topic}\nPLATFORM: ${script.targetPlatform}\n`
  output += `ESTIMATED DURATION: ${script.totalDurationSeconds} seconds\n\n`
  output += `--- POST PRODUCTION ---\n`
  output += `Music: ${script.postProduction.backgroundMusicMood} (Volume: ${script.postProduction.backgroundMusicVolume})\n`
  output += `Captions: ${script.postProduction.captionsEnabled ? 'Yes' : 'No'} (${script.postProduction.captionStyle})\n`
  output += `Color Grade: ${script.postProduction.colorGradePreset}\n`
  output += `Aspect Ratio: ${script.postProduction.aspectRatio}\n\n`
  
  script.scenes.forEach((s) => {
    output += `================================\n`
    output += `SCENE ${s.sceneNumber} (${s.sceneType}) [${s.startTimeSeconds}s - ${s.endTimeSeconds}s]\n`
    output += `================================\n`
    
    if (s.spokenLines) {
      output += `\nVOICEOVER / SPOKEN LINES:\n"${s.spokenLines}"\n`
    }

    if (s.avatar && s.avatar.placement !== 'HIDDEN') {
      output += `\nAVATAR:\nLocation: ${s.avatar.placement} | Size: ${s.avatar.size}\n`
      if (s.avatar.gestureHint) output += `Gesture: ${s.avatar.gestureHint}\n`
    }

    if (s.broll) {
      output += `\nB-ROLL (${s.broll.source}):\n${s.broll.visualDescription}\n`
      if (s.broll.infographicData) {
        output += `Infographic: ${s.broll.infographicData.title} (${s.broll.infographicData.type})\n`
      }
    }

    if (s.textOverlays.length > 0) {
      output += `\nTEXT OVERLAYS:\n`
      s.textOverlays.forEach((t) => {
        output += `- "${t.text}" (${t.position}, ${t.style})\n`
      })
    }

    if (s.directorNote) {
      output += `\nDIRECTOR'S NOTE:\n* ${s.directorNote}\n`
    }
    output += `\n`
  })
  
  return output.trim()
}

export const ScriptView = ({ script }: ScriptViewProps) => {
  const [editedLines, setEditedLines] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    script.scenes.forEach((s) => {
      initial[s.sceneNumber] = s.spokenLines
    })
    return initial
  })

  const computedScenes = useMemo(() => {
    return script.scenes.map((s) => ({
      ...s,
      spokenLines: editedLines[s.sceneNumber] ?? s.spokenLines
    }))
  }, [editedLines, script.scenes])

  const copyAll = async () => {
    const updatedScript = { ...script, scenes: computedScenes }
    await navigator.clipboard.writeText(formatScriptText(updatedScript))
  }

  const downloadTxt = () => {
    const updatedScript = { ...script, scenes: computedScenes }
    const blob = new Blob([formatScriptText(updatedScript)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${script.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">{script.title}</h2>
            <div className="text-sm text-text-muted mt-1">Topic: {script.topic}</div>
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-primary hover:border-accent hover:bg-surface transition-colors"
            >
              <Copy className="h-4 w-4" /> Copy Text
            </button>
            <button
              onClick={downloadTxt}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-primary hover:border-accent hover:bg-surface transition-colors"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-text-muted">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg border border-border">
            <Play className="h-3.5 w-3.5 text-accent" />
            <span className="text-text-primary">{script.targetPlatform}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-text-primary">{script.totalDurationSeconds}</span> sec
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
             <span className="text-text-primary">{script.totalWordCount}</span> words
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
             <span className="text-text-primary">{script.sceneCount}</span> scenes
          </div>
        </div>
      </div>

      {/* Post Production Overview */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="bg-bg border-b border-border px-4 py-2.5 flex items-center gap-2">
          <Music className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Post Production</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-xs">
           <div>
              <div className="text-text-muted mb-1">Music Mood</div>
              <div className="font-medium text-text-primary capitalize">{script.postProduction.backgroundMusicMood}</div>
           </div>
           <div>
              <div className="text-text-muted mb-1">Color Grade</div>
              <div className="font-medium text-text-primary capitalize">{script.postProduction.colorGradePreset}</div>
           </div>
           <div>
              <div className="text-text-muted mb-1">Captions</div>
              <div className="font-medium text-text-primary">
                {script.postProduction.captionsEnabled ? script.postProduction.captionStyle : 'None'}
              </div>
           </div>
           <div>
              <div className="text-text-muted mb-1">Aspect Ratio</div>
              <div className="font-medium text-text-primary">{script.postProduction.aspectRatio}</div>
           </div>
        </div>
      </div>

      {/* Screenplay Scenes */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider pl-1">Screenplay Timeline</h3>
        {computedScenes.map((scene) => (
          <div key={scene.sceneNumber} className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            {/* Scene Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white font-bold text-sm">
                  {scene.sceneNumber}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                    {scene.sceneType.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {scene.startTimeSeconds}s - {scene.endTimeSeconds}s • {scene.durationSeconds}s duration
                  </div>
                </div>
              </div>
            </div>

            {/* Scene Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Voiceover Region */}
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase">
                    <MessageSquare className="h-3.5 w-3.5" /> Voiceover / Script
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted font-medium bg-bg px-2 py-0.5 rounded border border-border">
                      {scene.wordCount} words
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditedLines((prev) => ({ ...prev, [scene.sceneNumber]: script.scenes.find(s => s.sceneNumber === scene.sceneNumber)?.spokenLines ?? '' }))}
                      className="text-text-muted hover:text-accent transition-colors p-1"
                      title="Reset text"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                
                {scene.spokenLines ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck
                    className="flex-grow min-h-[100px] whitespace-pre-wrap rounded-lg border border-transparent bg-transparent p-2 font-mono text-sm leading-relaxed text-text-primary hover:border-border hover:bg-bg focus:border-accent focus:bg-bg focus:outline-none transition-all resize-none"
                    onInput={(e) => {
                      const text = (e.currentTarget.textContent ?? '').replace(/\u00A0/g, ' ')
                      setEditedLines((prev) => ({ ...prev, [scene.sceneNumber]: text }))
                    }}
                  >
                    {scene.spokenLines}
                  </div>
                ) : (
                  <div className="flex-grow min-h-[100px] flex items-center justify-center text-sm italic text-text-muted bg-bg/50 rounded-lg p-4">
                    [No Voiceover / Silence]
                  </div>
                )}
              </div>

              {/* Visuals Region */}
              <div className="p-4 space-y-5 bg-bg/30">
                {/* Director Note */}
                {scene.directorNote && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                      <AlertCircle className="h-3.5 w-3.5" /> Director Note
                    </div>
                    <p className="text-xs leading-relaxed text-text-muted italic border-l-2 border-accent pl-2">
                      {scene.directorNote}
                    </p>
                  </div>
                )}

                {/* Avatar Settings */}
                {scene.avatar && scene.avatar.placement !== 'HIDDEN' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase">
                      <User className="h-3.5 w-3.5" /> Avatar
                    </div>
                    <div className="bg-surface rounded-md border border-border p-2">
                      <div className="text-xs text-text-primary font-medium mb-1">
                        {scene.avatar.size.replace('_',' ')} format • {scene.avatar.placement.replace('_', ' ')}
                      </div>
                      {scene.avatar.gestureHint && (
                        <div className="text-[11px] text-text-muted leading-tight">
                          <span className="font-medium">Action:</span> {scene.avatar.gestureHint}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* B-Roll Settings */}
                {scene.broll && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase">
                      <Video className="h-3.5 w-3.5" /> B-Roll
                    </div>
                    <div className="bg-surface rounded-md border border-border p-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent">
                          {scene.broll.source.replace('_', ' ')}
                        </span>
                        {scene.broll.infographicData && (
                           <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning">
                            DATA VISUAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-primary leading-tight mt-1">
                         {scene.broll.visualDescription}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Text Overlays */}
                {scene.textOverlays.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase">
                      <Tv className="h-3.5 w-3.5" /> Text Overlays
                    </div>
                    <div className="space-y-1">
                      {scene.textOverlays.map((t, idx) => (
                        <div key={idx} className="bg-surface rounded-md border border-border p-2 text-[11px]">
                          <div className="font-bold text-text-primary mb-0.5">"{t.text}"</div>
                          <div className="text-text-muted flex items-center justify-between">
                             <span>{t.position} • {t.style}</span>
                             <span className="bg-bg border border-border px-1 rounded">{t.animateIn}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

