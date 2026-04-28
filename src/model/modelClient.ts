import type { ChatRequest, ChatResponse } from '../types/index.js'

export type ModelClient = {
  createChatCompletion(request: ChatRequest): Promise<ChatResponse>
}
