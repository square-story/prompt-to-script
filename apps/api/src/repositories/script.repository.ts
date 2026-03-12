import { supabase } from '@/config/supabase'
import { ScriptDocument } from '@/types'

class ScriptRepository {
  async create(data: ScriptDocument): Promise<ScriptDocument> {
    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        project_id: data.projectId,
        hook_variants: data.hookVariants,
        hook_variant_selected: data.hookVariantSelected,
        hook: data.hook,
        context: data.context,
        core_idea: data.coreIdea,
        example_evidence: data.exampleEvidence,
        conclusion: data.conclusion,
        call_to_action: data.callToAction,
        word_count: data.wordCount,
        estimated_duration_seconds: data.estimatedDurationSeconds,
        version: data.version,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return script as ScriptDocument
  }

  async approve(id: string): Promise<void> {
    await supabase
      .from('scripts')
      .update({ approved_at: new Date().toISOString() })
      .eq('id', id)
  }

  async findByProjectId(projectId: string): Promise<ScriptDocument | null> {
    const { data } = await supabase
      .from('scripts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data as ScriptDocument | null
  }
}

export const scriptRepository = new ScriptRepository()
