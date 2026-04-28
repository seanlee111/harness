export const agentErrorCategories = [
  'missing_api_key',
  'invalid_config',
  'auth',
  'rate_limit',
  'network',
  'server',
  'empty_model_output',
  'transcript_write',
  'policy_violation',
  'evaluation',
  'unknown',
] as const

export type AgentErrorCategory = (typeof agentErrorCategories)[number]

export type AgentError = {
  category: AgentErrorCategory
  message: string
  retryable: boolean
  cause?: unknown
}

export function isAgentErrorCategory(value: string): value is AgentErrorCategory {
  return agentErrorCategories.includes(value as AgentErrorCategory)
}
