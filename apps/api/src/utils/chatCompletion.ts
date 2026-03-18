import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

// ── Types ────────────────────────────────────────────────────
type LLMProvider = 'openai' | 'claude' | 'perplexity'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionParams {
  provider: LLMProvider
  model: string
  maxTokens: number
  messages: ChatMessage[]
  system?: string
  temperature?: number
  jsonMode?: boolean
}

interface ChatCompletionResult {
  content: string
  provider: LLMProvider
  model: string
  citations?: string[]
}

// ── Connector ────────────────────────────────────────────────
class ChatCompletion {
  private openaiClient: OpenAI | null = null
  private claudeClient: Anthropic | null = null

  private getOpenAI = (): OpenAI => {
    if (!this.openaiClient) {
      if (!env.openaiApiKey) throw new Error('OPENAI_API_KEY is not configured')
      this.openaiClient = new OpenAI({ apiKey: env.openaiApiKey })
    }
    return this.openaiClient
  }

  private getClaude = (): Anthropic => {
    if (!this.claudeClient) {
      if (!env.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
      this.claudeClient = new Anthropic({ apiKey: env.anthropicApiKey })
    }
    return this.claudeClient
  }

  // ── Public API ───────────────────────────────────────────
  create = async (params: ChatCompletionParams): Promise<ChatCompletionResult> => {
    if (env.llmMode !== 'real') {
      return { content: '', provider: params.provider, model: params.model }
    }

    switch (params.provider) {
      case 'openai':
        return this.callOpenAI(params)
      case 'claude':
        return this.callClaude(params)
      case 'perplexity':
        return this.callPerplexity(params)
      default:
        throw new Error(`Unknown LLM provider: ${params.provider}`)
    }
  }

  /** OpenAI Moderation endpoint — not a chat completion, kept separate */
  moderate = async (input: string): Promise<OpenAI.Moderations.ModerationCreateResponse> => {
    return this.getOpenAI().moderations.create({ input })
  }

  // ── Private adapters ─────────────────────────────────────
  private callOpenAI = async (params: ChatCompletionParams): Promise<ChatCompletionResult> => {
    const messages: OpenAI.ChatCompletionMessageParam[] = []

    if (params.system) {
      messages.push({ role: 'system', content: params.system })
    }
    for (const m of params.messages) {
      messages.push({ role: m.role, content: m.content })
    }

    const completion = await this.getOpenAI().chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      messages,
      ...(params.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    })

    return {
      content: completion.choices[0]?.message?.content ?? '',
      provider: 'openai',
      model: params.model,
    }
  }

  private callClaude = async (params: ChatCompletionParams): Promise<ChatCompletionResult> => {
    const claudeMessages: Anthropic.MessageParam[] = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const msg = await this.getClaude().messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      ...(params.system ? { system: params.system } : {}),
      messages: claudeMessages,
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''

    return {
      content: text,
      provider: 'claude',
      model: params.model,
    }
  }

  private callPerplexity = async (params: ChatCompletionParams): Promise<ChatCompletionResult> => {
    const apiKey = env.perplexityApiKey
    if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not configured')

    const messages: { role: string; content: string }[] = []
    if (params.system) {
      messages.push({ role: 'system', content: params.system })
    }
    for (const m of params.messages) {
      messages.push({ role: m.role, content: m.content })
    }

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        messages,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Perplexity request failed (${res.status}): ${body}`)
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
      citations?: string[]
    }

    return {
      content: json.choices?.[0]?.message?.content ?? '',
      provider: 'perplexity',
      model: params.model,
      citations: json.citations ?? [],
    }
  }
}

export type { LLMProvider, ChatMessage, ChatCompletionParams, ChatCompletionResult }
export const chatCompletion = new ChatCompletion()
