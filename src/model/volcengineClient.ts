import type { ChatRequest, ChatResponse } from '../types/index.js'
import type { ModelClient } from './modelClient.js'
import { modelHttpError, modelUnknownError } from './modelErrors.js'

export type VolcengineModelClientOptions = {
  apiKey: string
  baseURL: string
  model: string
  fetch?: typeof fetch
}

type OpenAIChatResponse = {
  id?: string
  model?: string
  choices?: Array<{ message?: { role?: string; content?: string } }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

function endpoint(baseURL: string): string {
  return `${baseURL.replace(/\/$/, '')}/chat/completions`
}

export function createVolcengineModelClient(
  options: VolcengineModelClientOptions,
): ModelClient {
  const fetchImpl = options.fetch ?? fetch

  return {
    async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
      try {
        const response = await fetchImpl(endpoint(options.baseURL), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: request.model || options.model,
            messages: request.messages,
            temperature: request.temperature,
          }),
        })

        const body = await response.text()
        if (!response.ok) {
          throw modelHttpError(response.status, body)
        }

        const parsed = JSON.parse(body) as OpenAIChatResponse
        const message = parsed.choices?.[0]?.message
        const content = message?.content?.trim()
        if (!content) {
          throw {
            category: 'empty_model_output',
            message: 'Model returned an empty assistant message',
            retryable: true,
          }
        }

        return {
          id: parsed.id,
          model: parsed.model ?? request.model ?? options.model,
          message: { role: 'assistant', content },
          usage: parsed.usage
            ? {
                inputTokens: parsed.usage.prompt_tokens,
                outputTokens: parsed.usage.completion_tokens,
                totalTokens: parsed.usage.total_tokens,
              }
            : undefined,
          raw: parsed,
        }
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'category' in error) {
          throw error
        }
        throw modelUnknownError(error)
      }
    },
  }
}
