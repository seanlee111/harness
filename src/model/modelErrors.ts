import type { AgentError } from '../types/index.js'

export function modelHttpError(status: number, body: string): AgentError {
  if (status === 401 || status === 403) {
    return {
      category: 'auth',
      message: `Model authentication failed: ${status}`,
      retryable: false,
    }
  }
  if (status === 429) {
    return {
      category: 'rate_limit',
      message: `Model rate limited: ${status}`,
      retryable: true,
    }
  }
  if (status >= 500) {
    return {
      category: 'server',
      message: `Model server error: ${status}: ${body}`,
      retryable: true,
    }
  }
  return {
    category: 'unknown',
    message: `Model request failed: ${status}: ${body}`,
    retryable: false,
  }
}

export function modelUnknownError(error: unknown): AgentError {
  if (error instanceof Error) {
    return { category: 'network', message: error.message, retryable: true, cause: error }
  }
  return {
    category: 'unknown',
    message: 'Unknown model error',
    retryable: false,
    cause: error,
  }
}
