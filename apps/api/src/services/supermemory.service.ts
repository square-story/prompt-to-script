import { env } from '@/config/env'

const BASE = 'https://api.supermemory.ai/v3'

class SupermemoryService {
  private headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.supermemoryApiKey}`,
  }

  async add(content: string, meta: { userId: string; projectId?: string; tags?: string[] }): Promise<void> {
    await fetch(`${BASE}/memories`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ content, metadata: meta, tags: meta.tags }),
    })
  }

  async search(query: string, meta: { userId: string; projectId?: string }): Promise<string[]> {
    const res = await fetch(`${BASE}/search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, userId: meta.userId, filters: meta.projectId ? { projectId: meta.projectId } : undefined, limit: 6 }),
    })
    const json = await res.json() as { results: { content: string }[] }
    return json.results?.map((r) => r.content) ?? []
  }
}

export const supermemoryService = new SupermemoryService()
