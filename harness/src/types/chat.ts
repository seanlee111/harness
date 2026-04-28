export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessage = {
  role: ChatRole
  content: string
  name?: string
}

export type TokenUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export type ChatRequest = {
  model: string
  messages: ChatMessage[]
  temperature?: number
  metadata?: Record<string, string>
}

export type ChatResponse = {
  id?: string
  model: string
  message: ChatMessage
  usage?: TokenUsage
  raw?: unknown
}
