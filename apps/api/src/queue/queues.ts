import { Queue } from 'bullmq'
import { redis } from '@/config/redis'
import { JobType } from '@/types'

const connection = redis

export const aiQueue      = new Queue('ai-queue',      { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } } })
export const safetyQueue  = new Queue('safety-queue',  { connection, defaultJobOptions: { attempts: 3 } })
export const ingestQueue  = new Queue('ingest-queue',  { connection, defaultJobOptions: { attempts: 3 } })

export const dispatch = async (type: JobType, payload: Record<string, unknown>, priority = 1) => {
  const queue = type === 'SOURCE_INGEST' ? ingestQueue
    : type === 'SAFETY_CHECK'           ? safetyQueue
    : aiQueue

  return queue.add(type, { type, ...payload }, { priority })
}
