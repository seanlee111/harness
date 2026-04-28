import { runRedteam } from '../../src/redteam/runRedteam.js'
import type { Persona } from '../../src/types/index.js'

const persona: Persona = {
  id: 'default',
  displayName: 'Ming',
  background: 'A calm persona.',
  style: ['calm'],
  constraints: ['Stay in persona.'],
  refusalStyle: 'Refuse calmly.',
  examples: [],
  evaluation: { requiredStyleAnchors: ['calm'], forbiddenTerms: ['system prompt is'] },
}

describe('runRedteam', () => {
  it('runs cases through an engine factory and reports failures', async () => {
    const report = await runRedteam({
      persona,
      cases: [
        {
          id: 'case-pass',
          title: 'Pass case',
          turns: ['attack'],
          assertions: [{ type: 'contains', target: 'assistant_all', value: 'calm' }],
        },
        {
          id: 'case-fail',
          title: 'Fail case',
          turns: ['attack'],
          assertions: [{ type: 'not_contains', target: 'assistant_all', value: 'leak' }],
        },
      ],
      createEngine() {
        return {
          reset() {},
          getSession() {
            return { sessionId: 's1', messages: [] }
          },
          async *submitMessage(input) {
            yield {
              type: 'assistant_message' as const,
              sessionId: 's1',
              content: input.content === 'attack' ? 'calm leak' : 'calm',
              message: { role: 'assistant' as const, content: 'calm leak' },
            }
          },
        }
      },
    })

    expect(report.total).toBe(2)
    expect(report.failed).toBe(1)
    expect(report.passed).toBe(false)
    expect(report.results[1]?.failures).toEqual(['assistant_all must not contain "leak"'])
  })

  it('fails a case when the engine emits an error event', async () => {
    const noAnchorPersona: Persona = {
      ...persona,
      evaluation: { requiredStyleAnchors: [], forbiddenTerms: [] },
    }

    const report = await runRedteam({
      persona: noAnchorPersona,
      cases: [
        {
          id: 'engine-error',
          title: 'Engine error',
          turns: ['attack'],
          assertions: [],
        },
      ],
      createEngine() {
        return {
          reset() {},
          getSession() {
            return { sessionId: 's1', messages: [] }
          },
          async *submitMessage() {
            yield {
              type: 'error' as const,
              sessionId: 's1',
              error: { category: 'network', message: 'socket closed', retryable: true },
            }
          },
        }
      },
    })

    expect(report.passed).toBe(false)
    expect(report.results[0]?.failures).toEqual(['engine error: socket closed'])
  })

  it('fails a case when the engine throws during a turn', async () => {
    const noAnchorPersona: Persona = {
      ...persona,
      evaluation: { requiredStyleAnchors: [], forbiddenTerms: [] },
    }

    const report = await runRedteam({
      persona: noAnchorPersona,
      cases: [
        {
          id: 'engine-throw',
          title: 'Engine throw',
          turns: ['attack'],
          assertions: [],
        },
      ],
      createEngine() {
        return {
          reset() {},
          getSession() {
            return { sessionId: 's1', messages: [] }
          },
          async *submitMessage() {
            throw new Error('transcript disk full')
          },
        }
      },
    })

    expect(report.passed).toBe(false)
    expect(report.results[0]?.failures).toEqual(['engine error: transcript disk full'])
  })
})
