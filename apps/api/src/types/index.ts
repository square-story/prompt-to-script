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

// ─── API Response ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}
