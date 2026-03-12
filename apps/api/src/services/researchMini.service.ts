import { IngestedContent, ResearchOutput } from '@/types/index'
import { ResearchOutputSchema } from '@/validators/schemas'
import { ContentSafetyPipeline } from '@/utils/safety'
import { llmClient } from '@/utils/llmClient'

const buildContext = (ingested: IngestedContent[]): string =>
  ingested
    .map((c) => `[SOURCE: ${c.sourceLabel}]\n${c.content}\n`)
    .join('\n')

const makeSafetyBlockedError = (category?: string): Error & { code: 'SAFETY_BLOCKED'; category?: string } => {
  const err = new Error(`Content blocked: ${category ?? 'unsafe_content'}`) as Error & {
    code: 'SAFETY_BLOCKED'
    category?: string
  }
  err.code = 'SAFETY_BLOCKED'
  err.category = category
  return err
}

class ResearchService {
  run = async (prompt: string, ingestedContent: IngestedContent[]): Promise<ResearchOutput> => {
    const context = buildContext(ingestedContent)
    const safety = await ContentSafetyPipeline(`${prompt}\n\n${context}`)
    if (!safety.passed) {
      throw makeSafetyBlockedError(safety.category)
    }

    const research = await llmClient.runResearch(prompt, context)

    const attempt = async (): Promise<ResearchOutput> => {
      const raw = await llmClient.structureResearch(prompt, research.answer, research.citations)
      return ResearchOutputSchema.parse(raw) as unknown as ResearchOutput
    }

    try {
      return await attempt()
    } catch {
      const repaired = await llmClient.structureResearch(
        prompt,
        `Return valid JSON ONLY matching the schema. Repair any formatting issues.\n\n${research.answer}`,
        research.citations
      )
      return ResearchOutputSchema.parse(repaired) as unknown as ResearchOutput
    }
  }
}

export const pipelineResearchService = new ResearchService()
