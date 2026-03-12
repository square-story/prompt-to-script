import { chatCompletion } from '@/utils/chatCompletion'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { ResearchOutput, ScriptOutput } from '@/types/index'

interface ResearchCitation {
  url: string
  domain: string
  title?: string
}

interface ResearchResult {
  answer: string
  citations: ResearchCitation[]
}

const stripCodeFences = (text: string): string =>
  text.replace(/```json/gi, '').replace(/```/g, '').trim()

const safeJsonParse = (raw: string): unknown => {
  const cleaned = stripCodeFences(raw)
  return JSON.parse(cleaned)
}

const buildMockResearch = (prompt: string): ResearchOutput => ({
  topicSummary: `Mock research summary for: ${prompt}`,
  keyFindings: [
    {
      claim: 'This is a mocked key finding claim.',
      explanation: 'This is mocked explanatory text intended for UI wiring and local development.',
      citations: [{ url: 'https://example.com', domain: 'example.com', title: 'Example Source' }],
      confidence: 'medium',
    },
  ],
  statistics: [{ stat: 'Mock statistic: 42% of people said "it depends".', source: 'example.com (mock)' }],
  controversies: ['Mock controversy: experts disagree on the long-term impact in some contexts.'],
  verifiedFactsSummary:
    'Mock verified facts summary. Replace by setting LLM_MODE=real and providing API keys.',
})

const buildMockScript = (prompt: string): Omit<ScriptOutput, 'sections'> => ({
  hook: `Ever wondered about "${prompt}"? Here\u2019s the surprising part.`,
  context: 'This topic matters because it\u2019s changing fast and affecting everyday decisions.',
  coreIdea: 'The core idea is that small shifts compound into big outcomes over time.',
  exampleEvidence: 'One stat you can cite: \u201cMock statistic: 42%\u2026\u201d (example.com \u2014 mock).',
  conclusion: 'So the takeaway: focus on the signal, not the noise.',
  callToAction: 'If you want more breakdowns like this, follow for the next one.',
  totalWordCount: 180,
  estimatedDurationSeconds: 75,
})

class LlmClient {
  runResearch = async (prompt: string, context: string): Promise<ResearchResult> => {
    if (env.llmMode !== 'real') {
      return { answer: `MOCK research answer for: ${prompt}\n\nContext:\n${context}`, citations: [{ url: 'https://example.com', domain: 'example.com' }] }
    }

    const result = await chatCompletion.create({
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 2000,
      system: 'You are a thorough research analyst. Research the given topic using your knowledge. Provide key facts, relevant statistics, multiple expert perspectives, any controversies or conflicting views. Be specific and cite your knowledge sources where possible.',
      messages: [
        {
          role: 'user',
          content: `
Research this topic thoroughly with authoritative sources.
Topic: ${prompt}

Additional context from uploaded sources:
${context}

Provide a comprehensive research summary including:
- Key facts and findings
- Relevant statistics with sources
- Multiple expert perspectives
- Any controversies or conflicting views
`.trim(),
        },
      ],
    })

    return {
      answer: result.content,
      citations: [],
    }
  }

  structureResearch = async (prompt: string, researchAnswer: string, citations: ResearchCitation[]): Promise<unknown> => {
    if (env.llmMode !== 'real') {
      return buildMockResearch(prompt)
    }

    const result = await chatCompletion.create({
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 1500,
      system:
        'You are a research analyst. Structure the research data provided into clean, organised JSON. Extract only verifiable claims. Mark confidence as: high = multiple authoritative sources agree, medium = one strong source or general consensus, low = single source or disputed.',
      messages: [
        {
          role: 'user',
          content: `
Structure this research into valid JSON matching this exact schema:
{
  topicSummary: string,
  keyFindings: [{
    claim: string,
    explanation: string,
    citations: [{ url, domain, title? }],
    confidence: "high"|"medium"|"low"
  }],
  statistics: [{ stat: string, source: string }],
  controversies: string[],
  verifiedFactsSummary: string
}

Research data:
${researchAnswer}

Citations available:
${JSON.stringify(citations)}
`.trim(),
        },
      ],
    })

    return safeJsonParse(result.content)
  }

  generateScript = async (prompt: string, research: ResearchOutput): Promise<unknown> => {
    if (env.llmMode !== 'real') {
      return buildMockScript(prompt)
    }

    const result = await chatCompletion.create({
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 1200,
      system: `You are a short-form video script writer. Your scripts are:
- Conversational and engaging, not academic
- Based strictly on the verified facts provided — never invent facts
- Optimised for 60-90 second videos (150-225 words total)
- Structured with clear sections: Hook, Context, Core Idea, Example/Evidence, Conclusion, CTA`,
      messages: [
        {
          role: 'user',
          content: `
Write a structured video script about: "${prompt}"

VERIFIED RESEARCH (use ONLY these facts — do not invent any other claims):
${research.verifiedFactsSummary}

KEY FINDINGS:
${research.keyFindings.map((f) => `- ${f.claim} (${f.confidence} confidence)`).join('\n')}

STATISTICS AVAILABLE:
${research.statistics.map((s) => `- ${s.stat} (source: ${s.source})`).join('\n')}

Return ONLY valid JSON — no markdown, no explanation, no preamble:
{
  "hook": string,
  "context": string,
  "coreIdea": string,
  "exampleEvidence": string,
  "conclusion": string,
  "callToAction": string,
  "totalWordCount": number,
  "estimatedDurationSeconds": number
}
`.trim(),
        },
      ],
    })

    return safeJsonParse(result.content)
  }
}

export const llmClient = new LlmClient()
