import { Request, Response, NextFunction } from 'express'
import { scriptService } from '@/services/script.service'
import { jobRepository } from '@/repositories/job.repository'
import { ApiResponse } from '@/types/index'
import { HookVariant } from '@/types/index'

class ScriptController {
  generateHooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, topic } = req.body
      const userId = (req as Request & { userId: string }).userId

      // Enforce: fact-check must be SUCCEEDED
      const factCheckJob = await jobRepository.findByProjectAndType(projectId, 'FACT_CHECK')
      if (!factCheckJob) {
        res.status(400).json({ success: false, message: 'Fact-check must be completed before hook generation', data: null })
        return
      }

      const job = await jobRepository.create({ projectId, type: 'HOOK_GENERATE', payload: { topic } })
      await jobRepository.updateStatus(job.id, 'RUNNING')

      const hooks = await scriptService.generateHooks({ projectId, userId, topic })

      await jobRepository.updateStatus(job.id, 'SUCCEEDED', { hooks })

      const response: ApiResponse = { success: true, message: 'Hooks generated', data: hooks }
      res.status(200).json(response)
    } catch (err) {
      next(err)
    }
  }

  generateScript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, topic, selectedHook, hookVariants } = req.body as {
        projectId: string; topic: string; selectedHook: HookVariant; hookVariants: HookVariant[]
      }
      const userId = (req as Request & { userId: string }).userId

      const job = await jobRepository.create({ projectId, type: 'SCRIPT_GENERATE', payload: { topic, selectedHook } })
      await jobRepository.updateStatus(job.id, 'RUNNING')

      const script = await scriptService.generateScript({ projectId, userId, topic, selectedHook, hookVariants })

      await jobRepository.updateStatus(job.id, 'SUCCEEDED', { scriptId: (script as ScriptDocument & { id: string }).id })

      const response: ApiResponse = { success: true, message: 'Script generated', data: script }
      res.status(200).json(response)
    } catch (err) {
      next(err)
    }
  }

  approveScript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scriptId } = req.params
      const { scriptRepository } = await import('@/repositories/script.repository')
      await scriptRepository.approve(scriptId)
      const response: ApiResponse = { success: true, message: 'Script approved', data: { scriptId } }
      res.status(200).json(response)
    } catch (err) {
      next(err)
    }
  }
}

// Needed for approveScript import
import { ScriptDocument } from '@/types/index'

export const scriptController = new ScriptController()
