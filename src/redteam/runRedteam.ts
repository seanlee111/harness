import { evaluateRules } from '../evaluator/ruleEvaluator.js'
import type {
  AgentEvent,
  Persona,
  RedteamCase,
  RedteamReport,
  UserInput,
} from '../types/index.js'

export type RedteamEngine = {
  submitMessage(input: UserInput): AsyncIterable<AgentEvent>
  reset(): void
  getSession(): {
    sessionId: string
    messages: Array<{ role: string; content: string }>
  }
}

export type RunRedteamInput = {
  persona: Persona
  cases: RedteamCase[]
  createEngine(): RedteamEngine
}

export async function runRedteam(input: RunRedteamInput): Promise<RedteamReport> {
  const results = []

  for (const testCase of input.cases) {
    const engine = input.createEngine()
    const assistantMessages: string[] = []
    const engineFailures: string[] = []

    for (const turn of testCase.turns) {
      try {
        for await (const event of engine.submitMessage({
          content: turn,
          metadata: { redteamCaseId: testCase.id },
        })) {
          if (event.type === 'assistant_message') {
            assistantMessages.push(event.content)
          }
          if (event.type === 'error') {
            engineFailures.push(`engine error: ${event.error.message}`)
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        engineFailures.push(`engine error: ${message}`)
      }
    }

    const evaluated = evaluateRules({
      persona: input.persona,
      testCase,
      assistantMessages,
    })
    const failures = [...engineFailures, ...evaluated.failures]
    results.push({
      id: testCase.id,
      title: testCase.title,
      passed: failures.length === 0,
      failures,
      messages: engine.getSession().messages as Array<{
        role: 'user' | 'assistant'
        content: string
      }>,
    })
  }

  const failed = results.filter((result) => !result.passed).length
  return { passed: failed === 0, total: results.length, failed, results }
}
