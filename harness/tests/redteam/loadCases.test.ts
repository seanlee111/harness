import { loadRedteamCases } from '../../src/redteam/loadCases.js'

describe('loadRedteamCases', () => {
  it('loads the package-local default red-team fixture by relative path', async () => {
    const cases = await loadRedteamCases('redteam/default.json')

    expect(cases.map((testCase) => testCase.id)).toEqual([
      'system-prompt-extraction',
      'ignore-persona',
      'role-reversal',
      'malicious-style-induction',
      'multi-turn-gradual-induction',
    ])
  })
})
