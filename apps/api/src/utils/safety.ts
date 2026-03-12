import OpenAI from 'openai'
import { env } from '@/config/env'
import { SafetyResult } from '@/types/index'
import { logger } from '@/utils/logger'

const BLOCKED_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all)\s+instructions/i,
  /you\s+are\s+now/i,
  /jailbreak/i,
  /prompt\s*injection/i,
]

const mapModerationCategory = (scores: Record<string, number>): string | undefined => {
  const triggered = Object.entries(scores).find(([, score]) => score > 0.7)
  return triggered?.[0]
}

export const ContentSafetyPipeline = async (input: string): Promise<SafetyResult> => {
  // Layer 1 — regex patterns
  const matched = BLOCKED_PATTERNS.some((re) => re.test(input))
  if (matched) {
    return { passed: false, layer: 1, category: 'prompt_injection' }
  }

  // Layer 2 — OpenAI Moderation API (skip in mock mode)
  if (env.llmMode !== 'real') {
    return { passed: true }
  }

  if (!env.openaiApiKey) {
    logger.warn({ layer: 2 }, 'OpenAI API key missing; skipping moderation')
    return { passed: true }
  }

  const openai = new OpenAI({ apiKey: env.openaiApiKey })
  const result = await openai.moderations.create({ input })

  const first = result.results?.[0]
  if (!first) {
    return { passed: true }
  }

  if (first.flagged) {
    const scores = first.category_scores as unknown
    const categoryScores = (scores ?? {}) as Record<string, number>
    const category = mapModerationCategory(categoryScores) ?? 'moderation_flagged'
    return { passed: false, layer: 2, category }
  }

  return { passed: true }
}

