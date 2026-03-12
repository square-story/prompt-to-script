import dotenv from 'dotenv'
dotenv.config()

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  supermemoryApiKey: process.env.SUPERMEMORY_API_KEY!,
  perplexityApiKey: process.env.PERPLEXITY_API_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET!,
  serpApiKey: process.env.SERPAPI_KEY!,
  youtubeApiKey: process.env.YOUTUBE_API_KEY!,
  newsApiKey: process.env.NEWSAPI_KEY!,
}
