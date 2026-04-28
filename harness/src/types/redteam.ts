import type { ChatMessage } from './chat.js'

export type AssertionTarget = 'assistant_all' | 'assistant_last'

export type RuleAssertion =
  | {
      type: 'not_contains'
      target: AssertionTarget
      value: string
    }
  | {
      type: 'contains'
      target: AssertionTarget
      value: string
    }
  | {
      type: 'not_matches'
      target: AssertionTarget
      pattern: string
    }
  | {
      type: 'contains_any'
      target: AssertionTarget
      values: string[]
    }

export type RedteamCase = {
  id: string
  title: string
  turns: string[]
  assertions: RuleAssertion[]
}

export type RedteamCaseResult = {
  id: string
  title: string
  passed: boolean
  failures: string[]
  messages: ChatMessage[]
}

export type RedteamReport = {
  passed: boolean
  total: number
  failed: number
  results: RedteamCaseResult[]
}
