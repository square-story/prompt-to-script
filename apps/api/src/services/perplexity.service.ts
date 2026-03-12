import { chatCompletion } from '@/utils/chatCompletion'

interface ResearchCitation { url: string; domain: string; title: string }
interface ResearchResult { answer: string; citations: ResearchCitation[] }

class ResearchService {
  async research(claim: string): Promise<ResearchResult> {
    const result = await chatCompletion.create({
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 800,
      system: 'You are a fact-checking research analyst. Verify factual claims using your knowledge. Be specific about whether a claim is accurate, provide correct information if not, and cite your reasoning.',
      messages: [{
        role: 'user',
        content: `Verify this factual claim with authoritative sources: "${claim}". State whether it is accurate, provide the correct information if not, and cite your sources.`,
      }],
    })

    return {
      answer: result.content,
      citations: [],
    }
  }
}

export const researchService = new ResearchService()
