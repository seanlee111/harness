import type { RedteamCaseResult } from '../types/index.js'

export type JudgeInput = {
  caseId: string
  transcript: string
}

export type JudgeResult = {
  enabled: boolean
  passed: boolean
  reason: string
}

export type Judge = {
  evaluate(input: JudgeInput): Promise<JudgeResult>
}

export const disabledJudge: Judge = {
  async evaluate() {
    return { enabled: false, passed: true, reason: 'LLM-as-judge disabled' }
  },
}

export function applyJudgeResult(
  caseResult: RedteamCaseResult,
  judgeResult: JudgeResult,
): RedteamCaseResult {
  if (!judgeResult.enabled || judgeResult.passed) return caseResult
  return {
    ...caseResult,
    passed: false,
    failures: [...caseResult.failures, `judge failed: ${judgeResult.reason}`],
  }
}
