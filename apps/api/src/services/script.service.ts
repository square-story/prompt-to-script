import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { env } from '@/config/env'
import { supermemoryService } from '@/services/supermemory.service'
import { factCheckRepository } from '@/repositories/factcheck.repository'
import { scriptRepository } from '@/repositories/script.repository'
import { personaRepository } from '@/repositories/persona.repository'
import { ContentSafetyPipeline } from '@/utils/safetyPipeline'
import { HookVariant, ScriptDocument } from '@/types'

const claude = new Anthropic({ apiKey: env.anthropicApiKey })

const HookVariantsSchema = z.object({
  hooks: z.array(z.object({
    variant: z.enum(['A', 'B', 'C']),
    text: z.string(),
    toneDescriptor: z.string(),
  })),
})

const ScriptSchema = z.object({
  hook: z.string(),
  context: z.string(),
  coreIdea: z.string(),
  exampleEvidence: z.string(),
  conclusion: z.string(),
  callToAction: z.string(),
  wordCount: z.number(),
  estimatedDurationSeconds: z.number(),
})

class ScriptService {
  async generateHooks(input: { projectId: string; userId: string; topic: string }): Promise<HookVariant[]> {
    const [persona, factCheck, memoryContext] = await Promise.all([
      personaRepository.findByUserId(input.userId),
      factCheckRepository.findByProjectId(input.projectId),
      supermemoryService.search(input.topic, { userId: input.userId, projectId: input.projectId }),
    ])

    if (!factCheck) throw new Error('Fact-check must be completed before hook generation')

    const safety = await ContentSafetyPipeline(input.topic, { projectId: input.projectId })
    if (!safety.passed) throw new Error(`Safety blocked: ${safety.category}`)

    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: `You are a short-form video hook writer. Persona: brand voice = ${persona?.brandVoice}, audience = ${persona?.targetAudience}, niche = ${persona?.niche}, platform = ${persona?.platformPreference?.join(', ')}.`,
      messages: [{
        role: 'user',
        content: `Generate exactly 3 hook variants (A/B/C) for a short-form video about "${input.topic}". Each must have a distinct tone. Return only valid JSON: { "hooks": [{ "variant": "A"|"B"|"C", "text": string, "toneDescriptor": string }] }\n\nVerified facts summary: ${factCheck.factsBlockSummary}\nContext memory: ${memoryContext.join('\n')}`,
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const parsed = HookVariantsSchema.parse(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    return parsed.hooks
  }

  async generateScript(input: {
    projectId: string
    userId: string
    topic: string
    selectedHook: HookVariant
    hookVariants: HookVariant[]
  }): Promise<ScriptDocument> {
    const [persona, factCheck, memoryContext] = await Promise.all([
      personaRepository.findByUserId(input.userId),
      factCheckRepository.findByProjectId(input.projectId),
      supermemoryService.search(`${input.topic} ${input.selectedHook.text}`, { userId: input.userId, projectId: input.projectId }),
    ])

    if (!factCheck) throw new Error('Fact-check result required for script generation')

    const safety = await ContentSafetyPipeline(input.topic, { projectId: input.projectId })
    if (!safety.passed) throw new Error(`Safety blocked: ${safety.category}`)

    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: `You are a short-form video script writer. Persona: brand voice = ${persona?.brandVoice}, audience = ${persona?.targetAudience}, niche = ${persona?.niche}, platform = ${persona?.platformPreference?.join(', ')}, content goal = ${persona?.contentGoal}. Ground every factual claim in the Verified Facts Block provided. Never invent facts.`,
      messages: [{
        role: 'user',
        content: `Write a structured script for a 30-90 second video. Return only valid JSON matching this schema exactly: { "hook": string, "context": string, "coreIdea": string, "exampleEvidence": string, "conclusion": string, "callToAction": string, "wordCount": number, "estimatedDurationSeconds": number }\n\nSelected hook: "${input.selectedHook.text}"\nVerified facts summary: ${factCheck.factsBlockSummary}\nVerified facts: ${JSON.stringify(factCheck.verifiedFacts.map((f) => f.claim))}\nContext memory: ${memoryContext.join('\n')}`,
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const validated = ScriptSchema.parse(JSON.parse(raw.replace(/```json|```/g, '').trim()))

    const scriptDoc: ScriptDocument = {
      projectId: input.projectId,
      hookVariants: input.hookVariants,
      hookVariantSelected: input.selectedHook.variant,
      ...validated,
      version: 1,
    }

    const saved = await scriptRepository.create(scriptDoc)

    // Add to Supermemory for future persona context
    await supermemoryService.add(
      `Script for topic "${input.topic}": ${validated.hook} ${validated.coreIdea}`,
      { userId: input.userId, projectId: input.projectId, tags: ['script', 'content-history'] }
    )

    return saved
  }
}

export const scriptService = new ScriptService()
