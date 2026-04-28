export type VolcengineConfig = {
  apiKey: string
  baseURL: string
  model: string
}

export function loadVolcengineConfig(
  env: Record<string, string | undefined> = process.env,
): VolcengineConfig {
  const apiKey = env.VOLCENGINE_API_KEY
  if (!apiKey) throw new Error('Missing required environment variable VOLCENGINE_API_KEY')

  const baseURL = env.VOLCENGINE_BASE_URL
  if (!baseURL)
    throw new Error('Missing required environment variable VOLCENGINE_BASE_URL')

  const model = env.VOLCENGINE_MODEL
  if (!model) throw new Error('Missing required environment variable VOLCENGINE_MODEL')

  return { apiKey, baseURL, model }
}
