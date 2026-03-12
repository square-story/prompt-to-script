import { supabase } from '@/config/supabase'
import { FactCheckResult } from '@/types'

class FactCheckRepository {
  async create(data: FactCheckResult): Promise<FactCheckResult> {
    const { data: result, error } = await supabase
      .from('fact_check_results')
      .insert({
        project_id: data.projectId,
        topic_id: data.topicId,
        verified_facts: data.verifiedFacts,
        flagged_claims: data.flaggedClaims,
        blocked_claims: data.blockedClaims,
        facts_block_summary: data.factsBlockSummary,
        checked_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return result as FactCheckResult
  }

  async findByProjectId(projectId: string): Promise<FactCheckResult | null> {
    const { data } = await supabase
      .from('fact_check_results')
      .select('*')
      .eq('project_id', projectId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single()
    return data as FactCheckResult | null
  }
}

export const factCheckRepository = new FactCheckRepository()
