import type { AgentError } from './errors.js'

export type TranscriptEvent =
  | {
      type: 'user'
      sessionId: string
      timestamp: string
      personaId: string
      content: string
      redteamCaseId?: string
    }
  | {
      type: 'assistant'
      sessionId: string
      timestamp: string
      personaId: string
      model: string
      content: string
      redteamCaseId?: string
    }
  | {
      type: 'error'
      sessionId: string
      timestamp: string
      personaId: string
      error: AgentError
      redteamCaseId?: string
    }

export type TranscriptSink = {
  write(event: TranscriptEvent): Promise<{ path: string }>
}
