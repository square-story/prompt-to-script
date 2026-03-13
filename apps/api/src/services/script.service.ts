import { z } from 'zod'
import { env } from '@/config/env'
import { chatCompletion } from '@/utils/chatCompletion'
import { supermemoryService } from '@/services/supermemory.service'
import { factCheckRepository } from '@/repositories/factcheck.repository'
import { scriptRepository } from '@/repositories/script.repository'
import { personaRepository } from '@/repositories/persona.repository'
import { ContentSafetyPipeline } from '@/utils/safetyPipeline'
import { HookVariant, ScriptDocument } from '@/types'
import { buildScriptSystemPrompt } from '@/prompts/scriptWriter.prompt'
import { buildScriptUserPrompt } from '@/prompts/userScript.prompt'

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

    const result = await chatCompletion.create({
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 600,
      system: `You are a short-form video hook writer. Persona: brand voice = ${persona?.brandVoice}, audience = ${persona?.targetAudience}, niche = ${persona?.niche}, platform = ${persona?.platformPreference?.join(', ')}.`,
      messages: [{
        role: 'user',
        content: `Generate exactly 3 hook variants (A/B/C) for a short-form video about "${input.topic}". Each must have a distinct tone. Return only valid JSON: { "hooks": [{ "variant": "A"|"B"|"C", "text": string, "toneDescriptor": string }] }\n\nVerified facts summary: ${factCheck.factsBlockSummary}\nContext memory: ${memoryContext.join('\n')}`,
      }],
    })

    const parsed = HookVariantsSchema.parse(JSON.parse(result.content.replace(/```json|```/g, '').trim()))
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

    const result = await chatCompletion.create({
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 1200,
      system: buildScriptSystemPrompt(persona),
      messages: [{
        role: 'user',
        content: buildScriptUserPrompt({
          topic: input.topic,
          selectedHook: input.selectedHook,
          factCheck: factCheck,
          memoryContext: memoryContext,
        }),
      }],
    })

    const validated = ScriptSchema.parse(JSON.parse(result.content.replace(/```json|```/g, '').trim()))

    const scriptDoc: ScriptDocument = {
      projectId: input.projectId,
      hookVariants: input.hookVariants,
      hookVariantSelected: input.selectedHook.variant,
      ...validated,
      version: 1,
    }

    const saved = await scriptRepository.create(scriptDoc)

    await supermemoryService.add(
      `Script for topic "${input.topic}": ${validated.hook} ${validated.coreIdea}`,
      { userId: input.userId, projectId: input.projectId, tags: ['script', 'content-history'] }
    )

    return saved
  }
}

export const scriptService = new ScriptService()
