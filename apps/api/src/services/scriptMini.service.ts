import { ResearchOutput, ScriptOutput, ScriptSection } from '@/types/index'
import { ScriptOutputSchema } from '@/validators/schemas'
import { ContentSafetyPipeline } from '@/utils/safety'
import { llmClient } from '@/utils/llmClient'

const makeSafetyBlockedError = (category?: string): Error & { code: 'SAFETY_BLOCKED'; category?: string } => {
  const err = new Error(`Content blocked: ${category ?? 'unsafe_content'}`) as Error & {
    code: 'SAFETY_BLOCKED'
    category?: string
  }
  err.code = 'SAFETY_BLOCKED'
  err.category = category
  return err
}

const wordCount = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

class ScriptService {
  run = async (prompt: string, research: ResearchOutput): Promise<Omit<ScriptOutput, 'sections'>> => {
    const safety = await ContentSafetyPipeline(prompt)
    if (!safety.passed) {
      throw makeSafetyBlockedError(safety.category)
    }

    const attempt = async (): Promise<Omit<ScriptOutput, 'sections'>> => {
      const raw = await llmClient.generateScript(prompt, research)
      const validated = ScriptOutputSchema.parse(raw) as unknown as Omit<ScriptOutput, 'sections'>
      return validated
    }

    try {
      return await attempt()
    } catch {
      const raw = await llmClient.generateScript(
        prompt,
        {
          ...research,
          verifiedFactsSummary: `Return valid JSON ONLY matching the schema. Repair formatting issues.\n\n${research.verifiedFactsSummary}`,
        }
      )
      return ScriptOutputSchema.parse(raw) as unknown as Omit<ScriptOutput, 'sections'>
    }
  }

  buildSections = (script: Omit<ScriptOutput, 'sections'>): ScriptSection[] => [
    {
      label: 'Hook',
      purpose: 'Capture attention in the first 3 seconds',
      content: script.hook,
      wordCount: wordCount(script.hook),
    },
    {
      label: 'Context',
      purpose: 'Set up why this topic matters',
      content: script.context,
      wordCount: wordCount(script.context),
    },
    {
      label: 'Core Idea',
      purpose: 'The main insight or message',
      content: script.coreIdea,
      wordCount: wordCount(script.coreIdea),
    },
    {
      label: 'Example / Evidence',
      purpose: 'A specific fact or story from research',
      content: script.exampleEvidence,
      wordCount: wordCount(script.exampleEvidence),
    },
    {
      label: 'Conclusion',
      purpose: 'Wrap up the message',
      content: script.conclusion,
      wordCount: wordCount(script.conclusion),
    },
    {
      label: 'Call to Action',
      purpose: 'Tell the viewer what to do next',
      content: script.callToAction,
      wordCount: wordCount(script.callToAction),
    },
  ]
}

export const pipelineScriptService = new ScriptService()

