import { mkdir, appendFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { TranscriptEvent, TranscriptSink } from '../types/index.js'
import { redactText } from './redact.js'

export type JsonlTranscriptWriterOptions = {
  filePath: string
  secrets?: string[]
}

function sanitizeEvent(event: TranscriptEvent, secrets: string[]): TranscriptEvent {
  if (event.type === 'user') {
    return { ...event, content: redactText(event.content, secrets) }
  }
  if (event.type === 'assistant') {
    return { ...event, content: redactText(event.content, secrets) }
  }
  return {
    ...event,
    error: {
      ...event.error,
      message: redactText(event.error.message, secrets),
      cause: undefined,
    },
  }
}

export function createJsonlTranscriptWriter(
  options: JsonlTranscriptWriterOptions,
): TranscriptSink {
  return {
    async write(event) {
      await mkdir(dirname(options.filePath), { recursive: true })
      const sanitized = sanitizeEvent(event, options.secrets ?? [])
      await appendFile(options.filePath, `${JSON.stringify(sanitized)}\n`, 'utf8')
      return { path: options.filePath }
    },
  }
}
