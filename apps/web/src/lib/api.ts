import { ApiResponse, PipelineResult } from '@/types/pipeline'

const withTimeout = async <T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fn(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

export const runPipeline = async (formData: FormData): Promise<PipelineResult> => {
  const baseUrl = 'http://localhost:4000'

  return await withTimeout(async (signal) => {
    const res = await fetch(`${baseUrl}/api/v1/pipeline/run`, {
      method: 'POST',
      body: formData,
      signal,
    })

    const json = (await res.json()) as ApiResponse<PipelineResult>
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Request failed')
    }

    if (!json.data) {
      throw new Error('Invalid server response')
    }

    return json.data
  }, 120_000)
}

