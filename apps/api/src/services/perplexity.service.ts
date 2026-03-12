import { env } from '@/config/env'

interface PerplexityCitation { url: string; domain: string; title: string }
interface PerplexityResult { answer: string; citations: PerplexityCitation[] }

class PerplexityService {
  private headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.perplexityApiKey}`,
  }

  async research(claim: string): Promise<PerplexityResult> {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: `Verify this factual claim with authoritative sources: "${claim}". State whether it is accurate, provide the correct information if not, and cite your sources.`,
        }],
        return_citations: true,
        return_related_questions: false,
      }),
    })
    const json = await res.json() as {
      choices: { message: { content: string } }[]
      citations?: PerplexityCitation[]
    }
    return {
      answer: json.choices[0]?.message?.content ?? '',
      citations: json.citations ?? [],
    }
  }
}

export const perplexityService = new PerplexityService()
