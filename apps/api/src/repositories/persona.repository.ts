import { supabase } from '@/config/supabase'
import { PersonaProfile } from '@/types'

class PersonaRepository {
  async findByUserId(userId: string): Promise<PersonaProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !data) return null
    return data as PersonaProfile
  }

  async upsert(profile: Partial<PersonaProfile> & { userId: string }): Promise<PersonaProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ ...profile, user_id: profile.userId, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as PersonaProfile
  }
}

export const personaRepository = new PersonaRepository()
