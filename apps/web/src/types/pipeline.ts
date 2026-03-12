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

export interface ScriptSection {
  label: string
  purpose: string
  content: string
  wordCount: number
}

export interface ScriptOutput {
  hook: string
  context: string
  coreIdea: string
  exampleEvidence: string
  conclusion: string
  callToAction: string
  totalWordCount: number
  estimatedDurationSeconds: number
  sections: ScriptSection[]
}

export interface PipelineResult {
  research: ResearchOutput
  script: ScriptOutput
  safetyPassed: boolean
  processingTimeMs: number
}

