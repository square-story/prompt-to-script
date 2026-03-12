import dotenv from 'dotenv'
import { z } from 'zod'
dotenv.config()

const emptyToUndefined = <T>(value: T): T | undefined => {
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Toggleable LLM wiring for the mini prototype
  LLM_MODE: z.enum(['mock', 'real']).default('mock'),

  // AI Services (required only when LLM_MODE=real)
  ANTHROPIC_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  PERPLEXITY_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  // Existing v2 deps (keep compatible; may be unused in mini)
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SUPERMEMORY_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SERPAPI_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  YOUTUBE_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEWSAPI_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
})

const rawEnv = EnvSchema.parse(process.env)

if (rawEnv.LLM_MODE === 'real') {
  const missing: string[] = []
  if (!rawEnv.OPENAI_API_KEY) missing.push('OPENAI_API_KEY')
  if (missing.length > 0) {
    throw new Error(`Missing required env vars for LLM_MODE=real: ${missing.join(', ')}`)
  }
}

export const env = {
  port: rawEnv.PORT,
  nodeEnv: rawEnv.NODE_ENV,

  llmMode: rawEnv.LLM_MODE || 'real',
  anthropicApiKey: rawEnv.ANTHROPIC_API_KEY,
  perplexityApiKey: rawEnv.PERPLEXITY_API_KEY,
  openaiApiKey: rawEnv.OPENAI_API_KEY,

  supabaseUrl: rawEnv.SUPABASE_URL,
  supabaseServiceKey: rawEnv.SUPABASE_SERVICE_ROLE_KEY,
  supermemoryApiKey: rawEnv.SUPERMEMORY_API_KEY,
  redisUrl: rawEnv.REDIS_URL,
  jwtSecret: rawEnv.JWT_SECRET,
  serpApiKey: rawEnv.SERPAPI_KEY,
  youtubeApiKey: rawEnv.YOUTUBE_API_KEY,
  newsApiKey: rawEnv.NEWSAPI_KEY,
} as const
