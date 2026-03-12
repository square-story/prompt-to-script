import pino from 'pino'
import { env } from '@/config/env'

export const logger = pino({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.openaiApiKey',
      '*.anthropicApiKey',
      '*.perplexityApiKey',
    ],
    remove: true,
  },
})

