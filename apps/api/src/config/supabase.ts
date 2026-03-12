import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

const supabaseUrl = env.supabaseUrl ?? 'http://localhost:54321'
const supabaseKey = env.supabaseServiceKey ?? 'local-dev-placeholder'

if (!env.supabaseUrl || !env.supabaseServiceKey) {
  logger.warn('Supabase env vars missing; v2 DB features may not work')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
