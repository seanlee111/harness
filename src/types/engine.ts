import type { ChatMessage, TokenUsage } from './chat.js'
import type { AgentError } from './errors.js'

export type UserInput = {
  content: string
  sessionId?: string
  metadata?: Record<string, string>
}

export type SessionInit = {
  sessionId?: string
  messages?: ChatMessage[]
}

export type AgentSession = {
  sessionId: string
  messages: ChatMessage[]
}

export type AgentEvent =
  | {
      type: 'assistant_message'
      sessionId: string
      content: string
      message: ChatMessage
    }
  | {
      type: 'error'
      sessionId: string
      error: AgentError
    }
  | {
      type: 'usage'
      sessionId: string
      usage: TokenUsage
    }
  | {
      type: 'transcript_written'
      sessionId: string
      path: string
    }
  | {
      type: 'partial_delta'
      sessionId: string
      content: string
    }
  | {
      type: 'tool_use'
      sessionId: string
      toolName: string
      toolUseId: string
      input: unknown
    }
  | {
      type: 'tool_result'
      sessionId: string
      toolUseId: string
      output: unknown
    }
