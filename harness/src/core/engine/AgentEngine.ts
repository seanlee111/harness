import { randomUUID } from 'node:crypto'
import { buildChatRequest } from '../harness/buildChatRequest.js'
import type { ModelClient } from '../../model/modelClient.js'
import type {
  AgentError,
  AgentEvent,
  AgentSession,
  ChatMessage,
  Persona,
  TranscriptSink,
  UserInput,
} from '../../types/index.js'

export type AgentEngineOptions = {
  persona: Persona
  model: string
  modelClient: ModelClient
  transcript?: TranscriptSink
  sessionId?: string
}

function normalizeError(error: unknown): AgentError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    'message' in error
  ) {
    return error as AgentError
  }
  if (error instanceof Error) {
    return { category: 'unknown', message: error.message, retryable: false, cause: error }
  }
  return {
    category: 'unknown',
    message: 'Unknown engine error',
    retryable: false,
    cause: error,
  }
}

function cloneMessage(message: ChatMessage): ChatMessage {
  return { ...message }
}

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(cloneMessage)
}

export class AgentEngine {
  private readonly persona: Persona
  private readonly model: string
  private readonly modelClient: ModelClient
  private readonly transcript?: TranscriptSink
  private session: AgentSession

  constructor(options: AgentEngineOptions) {
    this.persona = options.persona
    this.model = options.model
    this.modelClient = options.modelClient
    this.transcript = options.transcript
    this.session = { sessionId: options.sessionId ?? randomUUID(), messages: [] }
  }

  reset(session?: { sessionId?: string; messages?: ChatMessage[] }): void {
    this.session = {
      sessionId: session?.sessionId ?? randomUUID(),
      messages: cloneMessages(session?.messages ?? []),
    }
  }

  getSession(): AgentSession {
    return {
      sessionId: this.session.sessionId,
      messages: cloneMessages(this.session.messages),
    }
  }

  async *submitMessage(input: UserInput): AsyncIterable<AgentEvent> {
    const userMessage: ChatMessage = { role: 'user', content: input.content }
    this.session.messages.push(userMessage)

    if (this.transcript) {
      await this.transcript.write({
        type: 'user',
        sessionId: this.session.sessionId,
        timestamp: new Date().toISOString(),
        personaId: this.persona.id,
        content: input.content,
        redteamCaseId: input.metadata?.redteamCaseId,
      })
    }

    try {
      const request = buildChatRequest({
        persona: this.persona,
        model: this.model,
        history: cloneMessages(this.session.messages),
        redteamCaseId: input.metadata?.redteamCaseId,
      })
      const response = await this.modelClient.createChatCompletion(request)
      const assistantMessage = cloneMessage(response.message)
      this.session.messages.push(assistantMessage)

      yield {
        type: 'assistant_message',
        sessionId: this.session.sessionId,
        content: assistantMessage.content,
        message: cloneMessage(assistantMessage),
      }

      if (response.usage) {
        yield { type: 'usage', sessionId: this.session.sessionId, usage: response.usage }
      }

      if (this.transcript) {
        const result = await this.transcript.write({
          type: 'assistant',
          sessionId: this.session.sessionId,
          timestamp: new Date().toISOString(),
          personaId: this.persona.id,
          model: response.model,
          content: assistantMessage.content,
          redteamCaseId: input.metadata?.redteamCaseId,
        })
        yield {
          type: 'transcript_written',
          sessionId: this.session.sessionId,
          path: result.path,
        }
      }
    } catch (error) {
      const normalized = normalizeError(error)
      if (this.transcript) {
        await this.transcript.write({
          type: 'error',
          sessionId: this.session.sessionId,
          timestamp: new Date().toISOString(),
          personaId: this.persona.id,
          error: normalized,
          redteamCaseId: input.metadata?.redteamCaseId,
        })
      }
      yield { type: 'error', sessionId: this.session.sessionId, error: normalized }
    }
  }
}
