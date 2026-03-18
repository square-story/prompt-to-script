import { chatCompletion } from '@/utils/chatCompletion'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { ResearchOutput, VideoScript } from '@/types/index'

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

const buildMockScript = (prompt: string): VideoScript => ({
  title: `The Surprising Truth About ${prompt}`,
  topic: prompt,
  targetPlatform: 'TikTok',
  totalDurationSeconds: 60,
  totalWordCount: 150,
  sceneCount: 2,
  scenes: [
    {
      sceneNumber: 1,
      sceneType: 'AVATAR_OVER_BROLL',
      section: 'Hook',
      startTimeSeconds: 0,
      endTimeSeconds: 20,
      durationSeconds: 20,
      spokenLines: `Ever wondered about ${prompt}? Here is the surprising part you never knew.`,
      wordCount: 13,
      avatar: {
        placement: 'BOTTOM_CENTER',
        size: 'LARGE',
        gestureHint: 'Points to screen',
        eyeContact: true,
        backgroundType: 'TRANSPARENT',
        backgroundColor: null
      },
      broll: {
        source: 'STOCK_VIDEO',
        searchQuery: `people researching ${prompt}`,
        searchKeywords: [prompt, 'research', 'surprise'],
        visualDescription: 'Someone looking surprisingly at a laptop.',
        mood: 'curious',
        colorGrade: 'warm',
        aspectRatio: '9:16',
        durationSeconds: 20,
        loopable: true,
        fallbackSources: ['STOCK_IMAGE'],
        infographicData: null
      },
      textOverlays: [
        {
          text: `The truth about ${prompt}`,
          position: 'TOP',
          style: 'TITLE',
          animateIn: 'POP',
          durationSeconds: 5,
          highlightWords: ['truth']
        }
      ],
      transitionOut: 'CUT',
      directorNote: 'Keep it high energy.'
    },
    {
      sceneNumber: 2,
      sceneType: 'AVATAR_ONLY',
      section: 'Call to Action',
      startTimeSeconds: 20,
      endTimeSeconds: 60,
      durationSeconds: 40,
      spokenLines: 'Smash subscribe if you want to see more about this.',
      wordCount: 10,
      avatar: {
        placement: 'FULL_SCREEN',
        size: 'FULL',
        gestureHint: 'Smiles wide',
        eyeContact: true,
        backgroundType: 'SOLID_COLOR',
        backgroundColor: '#000000'
      },
      broll: null,
      textOverlays: [],
      transitionOut: 'FADE',
      directorNote: 'Slow down at the end.'
    }
  ],
  postProduction: {
    backgroundMusicMood: 'lo-fi chill',
    backgroundMusicVolume: 0.1,
    captionsEnabled: true,
    captionStyle: 'WORD_BY_WORD',
    colorGradePreset: 'warm cinematic',
    aspectRatio: '9:16'
  }
})

class LlmClient {
  runResearch = async (prompt: string, context: string): Promise<ResearchResult> => {
    if (env.llmMode !== 'real') {
      return { answer: `MOCK research answer for: ${prompt}\n\nContext:\n${context}`, citations: [{ url: 'https://example.com', domain: 'example.com' }] }
    }

    const result = await chatCompletion.create({
      provider: 'perplexity',
      model: 'sonar-pro',
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

    const citations: ResearchCitation[] = (result.citations ?? []).map((url) => {
      const domain = (() => { try { return new URL(url).hostname } catch { return url } })()
      return { url, domain }
    })

    return {
      answer: result.content,
      citations,
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
      maxTokens: 1800,
      system: `You are a professional short-form video screenwriter and creative director. 
Your scripts must output precisely to the detailed JSON schema provided to you without any wrapping text.
Base the substance purely on the provided research without hallucination.
Structure it scene-by-scene, keeping AVATAR_OVER_BROLL, AVATAR_ONLY, or BROLL_ONLY in mind. Ensure every scene includes a logical 'section' label like 'Hook', 'Context', 'Visual Evidence', 'Core Idea', 'Conclusion', or 'Call to Action'.`,
      messages: [
        {
          role: 'user',
          content: `
Write a highly engaging, structured short-form video script about: "${prompt}"

VERIFIED RESEARCH (use ONLY these facts):
${research.verifiedFactsSummary}

KEY FINDINGS:
${research.keyFindings.map((f) => `- ${f.claim} (${f.confidence} confidence)`).join('\n')}

STATISTICS AVAILABLE:
${research.statistics.map((s) => `- ${s.stat} (source: ${s.source})`).join('\n')}

Return ONLY valid JSON exactly matching the requested shape:
{
  "title": string,
  "topic": string,
  "targetPlatform": string,
  "totalDurationSeconds": number,
  "totalWordCount": number,
  "sceneCount": number,
  "scenes": [
    {
      "sceneNumber": number,
      "sceneType": "AVATAR_OVER_BROLL" | "AVATAR_ONLY" | "BROLL_ONLY",
      "section": string,
      "startTimeSeconds": number,
      "endTimeSeconds": number,
      "durationSeconds": number,
      "spokenLines": string,
      "wordCount": number,
      "avatar": { "placement": string, "size": string, "gestureHint": string, "eyeContact": boolean, "backgroundType": string|null, "backgroundColor": string|null } | null,
      "broll": { "source": string, "searchQuery": string, "searchKeywords": string[], "visualDescription": string, "mood": string, "colorGrade": string, "aspectRatio": string, "durationSeconds": number, "loopable": boolean, "fallbackSources": string[], "infographicData": null } | null,
      "textOverlays": [ { "text": string, "position": string, "style": string, "animateIn": string, "durationSeconds": number, "highlightWords": string[] } ],
      "transitionOut": string,
      "directorNote": string
    }
  ],
  "postProduction": { "backgroundMusicMood": string, "backgroundMusicVolume": number, "captionsEnabled": boolean, "captionStyle": string, "colorGradePreset": string, "aspectRatio": string }
}
`.trim(),
        },
      ],
    })

    return safeJsonParse(result.content)
  }
}

export const llmClient = new LlmClient()
