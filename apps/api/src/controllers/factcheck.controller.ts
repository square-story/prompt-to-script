import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { factCheckService } from '@/services/factcheck.service'
import { jobRepository } from '@/repositories/job.repository'
import { ApiResponse } from '@/types/index'

class FactCheckController {
  run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { topic, prompt, contextSnippets } = req.body
      const projectId = req.body.projectId ?? randomUUID()
      const userId = (req as Request & { userId: string }).userId

      // Create job record
      const job = await jobRepository.create({ projectId, type: 'FACT_CHECK', payload: { topic, prompt } })
      await jobRepository.updateStatus(job.id, 'RUNNING')

      const result = await factCheckService.run({ topic, prompt, contextSnippets: contextSnippets ?? [], projectId, orgId: userId })

      const hasFlags = result.flaggedClaims.length > 0
      await jobRepository.updateStatus(job.id, hasFlags ? 'FLAGGED' : 'SUCCEEDED', { factcheckId: result.factcheckId })

      const response: ApiResponse = { success: true, message: hasFlags ? 'Fact-check complete with flagged claims' : 'Fact-check complete', data: result }
      res.status(200).json(response)
    } catch (err) {
      next(err)
    }
  }
}

export const factCheckController = new FactCheckController()
