export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface ResearchCitation {
  url: string
  domain: string
  title?: string
}

export interface ResearchPoint {
  claim: string
  explanation: string
  citations: ResearchCitation[]
  confidence: 'high' | 'medium' | 'low'
}

export interface ResearchOutput {
  topicSummary: string
  keyFindings: ResearchPoint[]
  statistics: { stat: string; source: string }[]
  controversies: string[]
  verifiedFactsSummary: string
}

export interface AvatarDetail {
  placement: 'BOTTOM_CENTER' | 'FULL_SCREEN' | 'BOTTOM_LEFT' | 'HIDDEN' | string
  size: 'LARGE' | 'FULL' | 'MEDIUM' | 'SMALL' | string
  gestureHint: string
  eyeContact: boolean
  backgroundType: 'TRANSPARENT' | 'SOLID_COLOR' | null | string
  backgroundColor: string | null
}

export interface BrollDetail {
  source: 'STOCK_VIDEO' | 'INFOGRAPHIC' | 'AI_GENERATED' | 'STOCK_IMAGE' | string
  searchQuery: string
  searchKeywords: string[]
  visualDescription: string
  mood: string
  colorGrade: string
  aspectRatio: string
  durationSeconds: number
  loopable: boolean
  fallbackSources: string[]
  infographicData: {
    type: string
    title: string
    data: any
  } | null
}

export interface TextOverlayDetail {
  text: string
  position: 'TOP' | 'BOTTOM' | 'CENTER' | string
  style: 'TITLE' | 'CAPTION' | 'STAT' | 'QUOTE' | 'CTA' | string
  animateIn: 'POP' | 'SLIDE_UP' | 'TYPEWRITER' | 'FADE' | string
  durationSeconds: number
  highlightWords: string[]
}

export interface VideoScene {
  sceneNumber: number
  sceneType: 'AVATAR_OVER_BROLL' | 'AVATAR_ONLY' | 'BROLL_ONLY' | string
  startTimeSeconds: number
  endTimeSeconds: number
  durationSeconds: number
  spokenLines: string
  wordCount: number
  avatar: AvatarDetail | null
  broll: BrollDetail | null
  textOverlays: TextOverlayDetail[]
  transitionOut: 'CUT' | 'DISSOLVE' | 'FADE' | string
  directorNote: string
}

export interface PostProductionDetail {
  backgroundMusicMood: string
  backgroundMusicVolume: number
  captionsEnabled: boolean
  captionStyle: string
  colorGradePreset: string
  aspectRatio: string
}

export interface VideoScript {
  title: string
  topic: string
  targetPlatform: string
  totalDurationSeconds: number
  totalWordCount: number
  sceneCount: number
  scenes: VideoScene[]
  postProduction: PostProductionDetail
}

export interface PipelineResult {
  research: ResearchOutput
  script: VideoScript
  safetyPassed: boolean
  processingTimeMs: number
}

