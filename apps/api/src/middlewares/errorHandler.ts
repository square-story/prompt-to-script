import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiResponse } from '@/types'
import { logger } from '@/utils/logger'

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error({ err }, 'Request failed')

  if (err instanceof ZodError) {
    const first = err.issues[0]?.message ?? 'Invalid input'
    const response: ApiResponse = { success: false, message: `Invalid input: ${first}` }
    res.status(400).json(response)
    return
  }

  const maybe = err as Error & { code?: string; category?: string }
  if (maybe.code === 'SAFETY_BLOCKED') {
    const response: ApiResponse = { success: false, message: `Content blocked: ${maybe.category ?? 'unsafe_content'}` }
    res.status(403).json(response)
    return
  }

  const msg = (err.message ?? '').toLowerCase()
  if (msg.includes('timed out') || msg.includes('timeout')) {
    const response: ApiResponse = { success: false, message: 'Request timed out — try a shorter prompt' }
    res.status(504).json(response)
    return
  }

  if (msg.includes('perplexity') || msg.includes('anthropic') || msg.includes('claude') || msg.includes('openai')) {
    const response: ApiResponse = { success: false, message: 'Research service unavailable — try again' }
    res.status(502).json(response)
    return
  }

  const response: ApiResponse = { success: false, message: 'Something went wrong — try again' }
  res.status(500).json(response)
}
