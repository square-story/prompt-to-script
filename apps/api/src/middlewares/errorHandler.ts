import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '@/types'

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  const response: ApiResponse = { success: false, message: err.message || 'Internal server error' }
  res.status(500).json(response)
}
