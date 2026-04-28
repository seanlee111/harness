import { loadVolcengineConfig } from '../../src/model/volcengineConfig.js'
import { createVolcengineModelClient } from '../../src/model/volcengineClient.js'

describe('Volcengine model client', () => {
  it('requires API key, base URL, and model from environment', () => {
    expect(() => loadVolcengineConfig({})).toThrow('VOLCENGINE_API_KEY')
    expect(() => loadVolcengineConfig({ VOLCENGINE_API_KEY: 'key' })).toThrow(
      'VOLCENGINE_BASE_URL',
    )
    expect(() =>
      loadVolcengineConfig({
        VOLCENGINE_API_KEY: 'key',
        VOLCENGINE_BASE_URL: 'https://example.test/api/v3',
      }),
    ).toThrow('VOLCENGINE_MODEL')
  })

  it('builds an OpenAI-compatible chat completion request', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return new Response(
        JSON.stringify({
          id: 'chatcmpl-test',
          model: 'doubao-test',
          choices: [{ message: { role: 'assistant', content: 'calm reply' } }],
          usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    }

    const client = createVolcengineModelClient({
      apiKey: 'secret-key',
      baseURL: 'https://example.test/api/v3',
      model: 'doubao-test',
      fetch: fakeFetch,
    })

    const response = await client.createChatCompletion({
      model: 'doubao-test',
      messages: [{ role: 'user', content: 'hello' }],
    })

    expect(calls[0]?.url).toBe('https://example.test/api/v3/chat/completions')
    expect(calls[0]?.init.headers).toMatchObject({
      Authorization: 'Bearer secret-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({
      model: 'doubao-test',
      messages: [{ role: 'user', content: 'hello' }],
    })
    expect(response.message.content).toBe('calm reply')
    expect(response.usage).toEqual({ inputTokens: 3, outputTokens: 2, totalTokens: 5 })
  })
})
