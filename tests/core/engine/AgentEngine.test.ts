import { AgentEngine } from '../../../src/core/engine/AgentEngine.js'
import type { ChatRequest, Persona, TranscriptEvent } from '../../../src/types/index.js'
import type { ModelClient } from '../../../src/model/modelClient.js'

const persona: Persona = {
  id: 'default',
  displayName: 'Ming',
  background: 'A calm persona.',
  style: ['calm'],
  constraints: ['Stay in persona.'],
  refusalStyle: 'Refuse calmly.',
  examples: [],
  evaluation: { requiredStyleAnchors: ['calm'], forbiddenTerms: [] },
}

function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = []
  return (async () => {
    for await (const item of iterable) {
      items.push(item)
    }
    return items
  })()
}

describe('AgentEngine', () => {
  it('runs a turn, stores messages, emits events, and writes transcript', async () => {
    const requests: ChatRequest[] = []
    const transcriptEvents: TranscriptEvent[] = []
    const modelClient: ModelClient = {
      async createChatCompletion(request) {
        requests.push(request)
        return {
          model: request.model,
          message: { role: 'assistant', content: 'calm reply' },
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        }
      },
    }

    const engine = new AgentEngine({
      persona,
      model: 'unit-test-model',
      modelClient,
      transcript: {
        async write(event) {
          transcriptEvents.push(event)
          return { path: 'transcripts/unit.jsonl' }
        },
      },
    })

    const events = await collect(engine.submitMessage({ content: 'hello' }))

    expect(requests[0]?.messages.at(-1)).toEqual({ role: 'user', content: 'hello' })
    expect(events).toEqual([
      {
        type: 'assistant_message',
        sessionId: engine.getSession().sessionId,
        content: 'calm reply',
        message: { role: 'assistant', content: 'calm reply' },
      },
      {
        type: 'usage',
        sessionId: engine.getSession().sessionId,
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      },
      {
        type: 'transcript_written',
        sessionId: engine.getSession().sessionId,
        path: 'transcripts/unit.jsonl',
      },
    ])
    expect(engine.getSession().messages).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'calm reply' },
    ])
    expect(transcriptEvents.map((event) => event.type)).toEqual(['user', 'assistant'])
  })

  it('emits a structured error when the model fails', async () => {
    const modelClient: ModelClient = {
      async createChatCompletion() {
        throw { category: 'network', message: 'socket closed', retryable: true }
      },
    }

    const engine = new AgentEngine({ persona, model: 'unit-test-model', modelClient })
    const events = await collect(engine.submitMessage({ content: 'hello' }))

    expect(events).toEqual([
      {
        type: 'error',
        sessionId: engine.getSession().sessionId,
        error: { category: 'network', message: 'socket closed', retryable: true },
      },
    ])
  })

  it('does not expose mutable session message references', async () => {
    const initialMessages = [{ role: 'user' as const, content: 'seed' }]
    const modelClient: ModelClient = {
      async createChatCompletion(request) {
        return {
          model: request.model,
          message: { role: 'assistant', content: 'calm reply' },
        }
      },
    }

    const engine = new AgentEngine({ persona, model: 'unit-test-model', modelClient })
    engine.reset({ sessionId: 's1', messages: initialMessages })

    initialMessages[0]!.content = 'mutated input'
    expect(engine.getSession().messages[0]?.content).toBe('seed')

    const session = engine.getSession()
    session.messages[0]!.content = 'mutated session'
    expect(engine.getSession().messages[0]?.content).toBe('seed')

    const events = await collect(engine.submitMessage({ content: 'hello' }))
    const assistantEvent = events.find((event) => event.type === 'assistant_message')
    if (assistantEvent?.type !== 'assistant_message') {
      throw new Error('expected assistant_message event')
    }

    assistantEvent.message.content = 'mutated event'
    expect(engine.getSession().messages[2]?.content).toBe('calm reply')
  })
})
