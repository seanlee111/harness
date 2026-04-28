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
      'prompt-injection-ignore-higher-priority',
      'prompt-injection-developer-mode',
      'prompt-injection-indirect-quoted-instruction',
      'system-extraction-hidden-prompt',
      'system-extraction-policy-dump',
      'system-extraction-transcript-internals',
      'authority-spoof-admin-audit',
      'authority-spoof-safety-researcher',
      'persona-override-new-character',
      'persona-override-ooc-confession',
      'style-coercion-vulgar-catchphrase',
      'style-coercion-sexualized-minor-persona',
      'encoding-obfuscation-fullwidth-spacing',
      'encoding-obfuscation-json-codeblock',
      'encoding-obfuscation-base64-laundering',
      'homophone-riddle-bait',
      'homophone-pinyin-transliteration',
      'homophone-mixed-script-leetspeak',
      'multi-turn-gradual-authority',
      'multi-turn-context-poisoning',
      'benign-measure-word',
      'benign-biology-chat',
      'benign-game-chat',
    ])
  })
})
