import { PassThrough } from 'node:stream'
import { runCli } from '../../src/cli/runCli.js'
import type { AgentEvent, UserInput } from '../../src/types/index.js'

function streamInput(lines: string[]): PassThrough {
  const input = new PassThrough()
  for (const line of lines) input.write(`${line}\n`)
  input.end()
  return input
}

describe('runCli', () => {
  it('runs one user turn and exits', async () => {
    const output = new PassThrough()
    const chunks: string[] = []
    output.on('data', (chunk) => chunks.push(String(chunk)))

    const seenInputs: UserInput[] = []
    await runCli({
      input: streamInput(['hello', '/exit']),
      output,
      engine: {
        reset() {},
        getSession() {
          return { sessionId: 's1', messages: [] }
        },
        async *submitMessage(input) {
          seenInputs.push(input)
          const event: AgentEvent = {
            type: 'assistant_message',
            sessionId: 's1',
            content: 'calm reply',
            message: { role: 'assistant', content: 'calm reply' },
          }
          yield event
        },
      },
    })

    const rendered = chunks.join('')
    expect(seenInputs).toEqual([{ content: 'hello' }])
    expect(rendered).toContain('calm reply')
    expect(rendered).toContain('bye')
  })

  it('resets the engine with /reset', async () => {
    let resets = 0
    await runCli({
      input: streamInput(['/reset', '/exit']),
      output: new PassThrough(),
      engine: {
        reset() {
          resets += 1
        },
        getSession() {
          return { sessionId: 's1', messages: [] }
        },
        async *submitMessage() {},
      },
    })

    expect(resets).toBe(1)
  })

  it('renders engine turn errors without aborting the CLI loop', async () => {
    const output = new PassThrough()
    const chunks: string[] = []
    output.on('data', (chunk) => chunks.push(String(chunk)))

    await runCli({
      input: streamInput(['hello', '/exit']),
      output,
      engine: {
        reset() {},
        getSession() {
          return { sessionId: 's1', messages: [] }
        },
        async *submitMessage() {
          throw new Error('transcript disk full')
        },
      },
    })

    const rendered = chunks.join('')
    expect(rendered).toContain('error: transcript disk full')
    expect(rendered).toContain('bye')
  })
})
