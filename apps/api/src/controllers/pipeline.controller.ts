import { Request, Response, NextFunction } from 'express'
import { ingestionService } from '@/services/ingestion.service'
import { pipelineResearchService } from '@/services/researchMini.service'
import { pipelineScriptService } from '@/services/scriptMini.service'
import { PipelineInputSchema } from '@/validators/schemas'
import { ApiResponse, PipelineResult } from '@/types/index'

class PipelineController {
  run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startTime = Date.now()

      const { prompt, referenceUrls: urlsRaw } = req.body as { prompt?: string; referenceUrls?: string }
      const referenceUrls = urlsRaw ? (JSON.parse(urlsRaw) as unknown) : []

      const validated = PipelineInputSchema.parse({
        prompt,
        referenceUrls,
      })

      const pdfFile = req.file as Express.Multer.File | undefined

      const ingestedContent = await ingestionService.ingestAll(
        validated.prompt,
        pdfFile?.buffer,
        pdfFile?.originalname,
        validated.referenceUrls
      )

      const research = await pipelineResearchService.run(validated.prompt, ingestedContent)
      const scriptBase = await pipelineScriptService.run(validated.prompt, research)

      const sections = pipelineScriptService.buildSections(scriptBase)

      const totalWordCount =
        scriptBase.totalWordCount > 0 ? scriptBase.totalWordCount : sections.reduce((sum, s) => sum + s.wordCount, 0)

      const script = {
        ...scriptBase,
        totalWordCount,
        sections,
      }

      const result: PipelineResult = {
        research,
        script,
        safetyPassed: true,
        processingTimeMs: Date.now() - startTime,
      }

      const response: ApiResponse<PipelineResult> = {
        success: true,
        message: 'Pipeline complete',
        data: result,
      }

      res.status(200).json(response)
    } catch (err) {
      next(err as Error)
    }
  }
}

export const pipelineController = new PipelineController()

