import { supabase } from '@/config/supabase'
import { JobType, JobStatus } from '@/types'

interface JobRecord {
  id: string
  projectId: string
  type: JobType
  status: JobStatus
  payload?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  attempts: number
}

class JobRepository {
  async create(data: { projectId: string; type: JobType; payload: Record<string, unknown>; orgId?: string }): Promise<JobRecord> {
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        project_id: data.projectId,
        type: data.type,
        status: 'QUEUED',
        payload: data.payload,
        attempts: 0,
        org_id: data.orgId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return job as JobRecord
  }

  async updateStatus(id: string, status: JobStatus, result?: Record<string, unknown>, error?: string): Promise<void> {
    await supabase
      .from('jobs')
      .update({ status, result, error, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  async findByProjectAndType(projectId: string, type: JobType): Promise<JobRecord | null> {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .eq('status', 'SUCCEEDED')
      .single()
    return data as JobRecord | null
  }
}

export const jobRepository = new JobRepository()
