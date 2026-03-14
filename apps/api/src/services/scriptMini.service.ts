import { ResearchOutput, VideoScript } from '@/types/index'
import { VideoScriptSchema } from '@/validators/schemas'
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

class ScriptService {
  run = async (prompt: string, research: ResearchOutput): Promise<VideoScript> => {
    const safety = await ContentSafetyPipeline(prompt)
    if (!safety.passed) {
      throw makeSafetyBlockedError(safety.category)
    }

    const attempt = async (): Promise<VideoScript> => {
      const raw = await llmClient.generateScript(prompt, research)
      const validated = VideoScriptSchema.parse(raw) as unknown as VideoScript
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
      return VideoScriptSchema.parse(raw) as unknown as VideoScript
    }
  }
}

export const pipelineScriptService = new ScriptService()

