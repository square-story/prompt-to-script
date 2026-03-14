// ─── Job Types ───────────────────────────────────────────────
export type JobType =
  | 'TOPIC_DISCOVER'
  | 'FACT_CHECK'
  | 'HOOK_GENERATE'
  | 'SCRIPT_GENERATE'
  | 'SOURCE_INGEST'
  | 'SAFETY_CHECK'

export type JobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'BLOCKED'
  | 'FLAGGED'

// ─── Safety ──────────────────────────────────────────────────
export interface SafetyResult {
  passed: boolean
  layer?: number
  category?: string
  reason?: string
}

// ─── Persona ─────────────────────────────────────────────────
export interface PersonaProfile {
  id: string
  userId: string
  niche: string
  subNiche: string
  targetAudience: string
  contentGoal: string
  brandVoice: string
  platformPreference: string[]
  keywords: string[]
  language: string
  clonedVoiceId?: string
  avatarUrl?: string
}

// ─── Topic ───────────────────────────────────────────────────
export interface TopicCandidate {
  topicId: string
  title: string
  trendScore: number
  platformSignals: { platform: string; signalType: string; value: number }[]
  suggestedAngles: { angle: string; toneDescriptor: string }[]
  contextSnippets: string[]
  sourceUrls: string[]
  fetchedAt: string
}

// ─── Fact-Check ──────────────────────────────────────────────
export interface ExtractedClaim {
  claim: string
  type: 'statistic' | 'date' | 'attribution' | 'scientific' | 'historical' | 'general'
  needsVerification: boolean
}

export interface VerifiedFact {
  claim: string
  sources: { url: string; domain: string; title: string }[]
  confidenceScore: number
}

export interface FlaggedClaim {
  claim: string
  reason: string
  sourcesChecked: string[]
}

export interface BlockedClaim {
  claim: string
  contradictionSource: string
  correctionNote: string
}

export interface FactCheckResult {
  factcheckId: string
  topicId: string
  projectId: string
  verifiedFacts: VerifiedFact[]
  flaggedClaims: FlaggedClaim[]
  blockedClaims: BlockedClaim[]
  factsBlockSummary: string
  checkedAt: string
}

// ─── Script ──────────────────────────────────────────────────
export interface HookVariant {
  variant: 'A' | 'B' | 'C'
  text: string
  toneDescriptor: string
}

export interface ScriptDocument {
  projectId: string
  hookVariants: HookVariant[]
  hookVariantSelected: 'A' | 'B' | 'C'
  hook: string
  context: string
  coreIdea: string
  exampleEvidence: string
  conclusion: string
  callToAction: string
  wordCount: number
  estimatedDurationSeconds: number
  version: number
}

export interface FactCheckDocument {
  factcheckId: string
  topicId: string
  projectId: string
  verifiedFacts: VerifiedFact[]
  flaggedClaims: FlaggedClaim[]
  blockedClaims: BlockedClaim[]
  factsBlockSummary: string
  checkedAt: string
}

// ─── API Response ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// ─── Prompt → Research → Script (Mini Pipeline) ───────────────

export interface PipelineInput {
  prompt: string
  referenceUrls?: string[]
}

export interface IngestedContent {
  sourceType: 'pdf' | 'url' | 'prompt'
  content: string
  sourceLabel: string
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
