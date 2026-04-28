import { createInterface } from 'node:readline/promises'
import type { Readable, Writable } from 'node:stream'
import type { AgentEvent, UserInput } from '../types/index.js'

export type CliEngine = {
  submitMessage(input: UserInput): AsyncIterable<AgentEvent>
  reset(): void
  getSession(): { sessionId: string }
}

export type RunCliOptions = {
  input: Readable
  output: Writable
  engine: CliEngine
}

function write(output: Writable, text: string): void {
  output.write(text)
}

async function renderEvent(output: Writable, event: AgentEvent): Promise<void> {
  if (event.type === 'assistant_message') {
    write(output, `${event.content}\n`)
    return
  }
  if (event.type === 'error') {
    write(output, `error: ${event.error.message}\n`)
    return
  }
  if (event.type === 'transcript_written') {
    write(output, `transcript: ${event.path}\n`)
  }
}

export async function runCli(options: RunCliOptions): Promise<void> {
  const rl = createInterface({
    input: options.input,
    output: options.output,
    terminal: false,
  })
  write(options.output, 'agent harness ready\n')

  let sawAnyLine = false
  for await (const line of rl) {
    sawAnyLine = true
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed === '/exit') {
      write(options.output, 'bye\n')
      break
    }

    if (trimmed === '/reset') {
      options.engine.reset()
      write(options.output, `reset: ${options.engine.getSession().sessionId}\n`)
      continue
    }

    try {
      for await (const event of options.engine.submitMessage({ content: trimmed })) {
        await renderEvent(options.output, event)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      write(options.output, `error: ${message}\n`)
    }
  }

  // If stdin is closed immediately (common in non-interactive run configs), the REPL
  // will exit right away. Emit a hint so it doesn't look like a hang or no-op.
  if (!sawAnyLine) {
    write(
      options.output,
      'stdin closed (non-interactive). Run `npm run cli` in an interactive terminal.\n',
    )
  }
}
