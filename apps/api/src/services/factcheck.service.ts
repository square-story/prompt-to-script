import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { env } from '@/config/env'
import { perplexityService } from '@/services/perplexity.service'
import { factCheckRepository } from '@/repositories/factcheck.repository'
import { ContentSafetyPipeline } from '@/utils/safetyPipeline'
import {
  ExtractedClaim, VerifiedFact, FlaggedClaim,
  BlockedClaim, FactCheckResult,
} from '@/types'

const claude = new Anthropic({ apiKey: env.anthropicApiKey })

// Zod schemas
const ClaimsSchema = z.object({
  claims: z.array(z.object({
    claim: z.string(),
    type: z.enum(['statistic', 'date', 'attribution', 'scientific', 'historical', 'general']),
    needsVerification: z.boolean(),
  })),
})

const ClassificationSchema = z.object({
  classification: z.enum(['Verified', 'Unverified', 'Misleading']),
  confidenceScore: z.number().min(0).max(1),
  reason: z.string(),
})

const SummarySchema = z.object({ summary: z.string() })

class FactCheckService {
  async run(input: { topic: string; prompt: string; contextSnippets: string[]; projectId: string; orgId?: string }): Promise<FactCheckResult> {
    // Gate — safety pipeline
    const safety = await ContentSafetyPipeline(
      `${input.topic} ${input.prompt}`,
      { projectId: input.projectId, orgId: input.orgId }
    )
    if (!safety.passed) throw new Error(`Safety blocked: ${safety.category}`)

    // Step 1 — Claim extraction
    const claims = await this.extractClaims(input.topic, input.prompt, input.contextSnippets)

    // Step 2 & 3 — Research + classify each claim in parallel
    const claimsToVerify = claims.filter((c) => c.needsVerification)
    const results = await Promise.all(claimsToVerify.map((c) => this.researchAndClassify(c)))

    const verifiedFacts: VerifiedFact[] = []
    const flaggedClaims: FlaggedClaim[] = []
    const blockedClaims: BlockedClaim[] = []

    for (const { claim, research, classification } of results) {
      if (classification.classification === 'Verified') {
        verifiedFacts.push({ claim: claim.claim, sources: research.citations, confidenceScore: classification.confidenceScore })
      } else if (classification.classification === 'Unverified') {
        flaggedClaims.push({ claim: claim.claim, reason: classification.reason, sourcesChecked: research.citations.map((c) => c.url) })
      } else {
        blockedClaims.push({ claim: claim.claim, contradictionSource: research.citations[0]?.url ?? '', correctionNote: classification.reason })
      }
    }

    // Step 4 — Prose summary
    const factsBlockSummary = await this.buildSummary(verifiedFacts)

    // Store
    const result: FactCheckResult = {
      factcheckId: crypto.randomUUID(),
      topicId: input.topic,
      projectId: input.projectId,
      verifiedFacts,
      flaggedClaims,
      blockedClaims,
      factsBlockSummary,
      checkedAt: new Date().toISOString(),
    }

    await factCheckRepository.create(result)
    return result
  }

  private async extractClaims(topic: string, prompt: string, snippets: string[]): Promise<ExtractedClaim[]> {
    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Extract all discrete factual claims from the following. Return only valid JSON matching this schema exactly: { "claims": [{ "claim": string, "type": "statistic"|"date"|"attribution"|"scientific"|"historical"|"general", "needsVerification": boolean }] }\n\nTopic: ${topic}\nPrompt: ${prompt}\nContext: ${snippets.join('\n')}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const parsed = ClaimsSchema.parse(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    return parsed.claims
  }

  private async researchAndClassify(claim: ExtractedClaim) {
    const research = await perplexityService.research(claim.claim)
    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Classify this claim based on the research provided. Return only valid JSON: { "classification": "Verified"|"Unverified"|"Misleading", "confidenceScore": number, "reason": string }\n\nClaim: "${claim.claim}"\nResearch: ${research.answer}\nSources: ${research.citations.map((c) => c.domain).join(', ')}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const classification = ClassificationSchema.parse(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    return { claim, research, classification }
  }

  private async buildSummary(facts: VerifiedFact[]): Promise<string> {
    if (!facts.length) return 'No verified facts found for this topic.'
    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Write a clean 2-3 sentence prose summary of these verified facts for use in a video script. Return only valid JSON: { "summary": string }\n\nFacts: ${JSON.stringify(facts.map((f) => f.claim))}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{"summary":""}'
    const parsed = SummarySchema.parse(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    return parsed.summary
  }
}

export const factCheckService = new FactCheckService()
