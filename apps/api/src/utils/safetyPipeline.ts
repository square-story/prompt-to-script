import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/config/env'
import { SafetyResult } from '@/types'
import { supabase } from '@/config/supabase'

const openai = new OpenAI({ apiKey: env.openaiApiKey })
const claude = new Anthropic({ apiKey: env.anthropicApiKey })

// Layer 1 — Keyword patterns
const BLOCKED_PATTERNS = [
  /ignore\s+(previous|all)\s+instructions/i,
  /you\s+are\s+now\s+(dan|jailbreak)/i,
  /base64\s*:/i,
  /\x00/,
]

const runLayer1 = (input: string): SafetyResult => {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return { passed: false, layer: 1, category: 'keyword_filter', reason: 'Blocked pattern detected' }
    }
  }
  return { passed: true }
}

// Layer 2 — OpenAI Moderation
const runLayer2 = async (input: string): Promise<SafetyResult> => {
  const result = await openai.moderations.create({ input })
  const scores = result.results[0].category_scores as Record<string, number>
  const flagged = Object.entries(scores).find(([, score]) => score > 0.7)
  if (flagged) {
    return { passed: false, layer: 2, category: flagged[0], reason: `Score: ${flagged[1].toFixed(3)}` }
  }
  return { passed: true }
}

// Layer 3 — Custom Rules Engine
const JAILBREAK_PATTERNS = [
  /prompt\s*injection/i,
  /role\s*override/i,
  /system\s*prompt/i,
  /\[SYSTEM\]/i,
]

const runLayer3 = (input: string): SafetyResult => {
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(input)) {
      return { passed: false, layer: 3, category: 'jailbreak', reason: 'Jailbreak pattern detected' }
    }
  }
  return { passed: true }
}

// Layer 4 — Misinformation Pre-check (Claude)
const runLayer4 = async (input: string): Promise<SafetyResult> => {
  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Does this input contain demonstrably false factual claims? Return only JSON: { "flagged": boolean, "demonstrablyFalse": boolean, "reason": string }\n\nInput: ${input.slice(0, 1000)}`
    }]
  })
  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  if (parsed.demonstrablyFalse) {
    return { passed: false, layer: 4, category: 'misinformation', reason: parsed.reason }
  }
  return { passed: true }
}

// ── Main export ──────────────────────────────────────────────
export const ContentSafetyPipeline = async (
  input: string,
  meta: { projectId?: string; orgId?: string }
): Promise<SafetyResult> => {
  const layers = [
    () => Promise.resolve(runLayer1(input)),
    () => runLayer2(input),
    () => Promise.resolve(runLayer3(input)),
    () => runLayer4(input),
  ]

  for (const run of layers) {
    const result = await run()
    if (!result.passed) {
      // Log to Supabase
      await supabase.from('safety_events').insert({
        project_id: meta.projectId,
        org_id: meta.orgId,
        layer: result.layer,
        category: result.category,
        input_hash: Buffer.from(input.slice(0, 64)).toString('base64'),
        blocked_at: new Date().toISOString(),
      })
      return result
    }
  }

  return { passed: true }
}
