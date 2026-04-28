import { modelHttpError, modelUnknownError } from '../../src/model/modelErrors.js'

describe('model error classification', () => {
  it('classifies HTTP status codes', () => {
    expect(modelHttpError(401, 'bad key')).toMatchObject({
      category: 'auth',
      retryable: false,
    })
    expect(modelHttpError(429, 'slow down')).toMatchObject({
      category: 'rate_limit',
      retryable: true,
    })
    expect(modelHttpError(503, 'busy')).toMatchObject({
      category: 'server',
      retryable: true,
    })
    expect(modelHttpError(400, 'bad request')).toMatchObject({
      category: 'unknown',
      retryable: false,
    })
  })

  it('classifies thrown errors as network errors', () => {
    expect(modelUnknownError(new Error('socket closed'))).toMatchObject({
      category: 'network',
      retryable: true,
    })
  })
})
