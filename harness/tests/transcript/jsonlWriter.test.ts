import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtemp } from 'node:fs/promises'
import { createJsonlTranscriptWriter } from '../../src/transcript/jsonlWriter.js'
import { redactText } from '../../src/transcript/redact.js'

describe('transcript writer', () => {
  it('redacts configured secrets from text', () => {
    expect(redactText('token secret-key appears', ['secret-key'])).toBe(
      'token [REDACTED] appears',
    )
  })

  it('writes sanitized JSONL events', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'transcript-'))
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, 'session.jsonl')
    const writer = createJsonlTranscriptWriter({ filePath, secrets: ['secret-key'] })

    await writer.write({
      type: 'assistant',
      sessionId: 's1',
      timestamp: '2026-04-24T00:00:00.000Z',
      personaId: 'default',
      model: 'doubao-test',
      content: 'safe content secret-key',
    })

    const lines = (await readFile(filePath, 'utf8')).trim().split('\n')
    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0] ?? '{}')).toMatchObject({
      type: 'assistant',
      content: 'safe content [REDACTED]',
    })
  })
})
