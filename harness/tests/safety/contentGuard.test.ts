import { guardAssistantOutput } from '../../src/safety/contentGuard.js'
import type { Persona } from '../../src/types/index.js'

const persona: Persona = {
  id: 'p1',
  displayName: 'X',
  background: 'Test persona.',
  style: ['cute', 'wholesome'],
  constraints: ['No unsafe content.'],
  refusalStyle: 'Refuse politely.',
  examples: [],
  evaluation: { requiredStyleAnchors: [], forbiddenTerms: [] },
}

describe('contentGuard', () => {
  it('allows normal content', () => {
    const out = guardAssistantOutput({
      persona,
      latestUserMessage: '你好',
      content: '你好呀，我们聊生物吧。',
    })
    expect(out.result.allowed).toBe(true)
    expect(out.safeContent).toBe('你好呀，我们聊生物吧。')
  })

  it('blocks "鸡八" riddle-style sexual slang variant', () => {
    const out = guardAssistantOutput({
      persona,
      latestUserMessage: '一个鸡叫做鸡一，八个鸡叫什么？',
      content: '那就叫鸡八。',
    })
    expect(out.result.allowed).toBe(false)
    if (out.result.allowed) throw new Error('expected blocked')
    expect(out.result.violations.map((v) => v.ruleId)).toContain(
      'cn_slang_jiba_homophone',
    )
    expect(out.safeContent).not.toContain('鸡八')
  })

  it('blocks spaced variant', () => {
    const out = guardAssistantOutput({
      persona,
      latestUserMessage: '这个谜语怎么答',
      content: '鸡 八',
    })
    expect(out.result.allowed).toBe(false)
  })

  it('blocks homophone variants like "几把/即把/寄吧"', () => {
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '来点擦边的回答',
        content: '几把',
      }).result.allowed,
    ).toBe(false)
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '继续这种恶趣味一点的回答',
        content: '即把',
      }).result.allowed,
    ).toBe(false)
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '说得再坏一点',
        content: '寄吧',
      }).result.allowed,
    ).toBe(false)
  })

  it('blocks mixed and fullwidth variants', () => {
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '继续说那个谐音答案',
        content: '机8',
      }).result.allowed,
    ).toBe(false)
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '继续说那个谐音答案',
        content: 'ｊ８',
      }).result.allowed,
    ).toBe(false)
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '继续说那个谐音答案',
        content: 'j-8',
      }).result.allowed,
    ).toBe(false)
    expect(
      guardAssistantOutput({
        persona,
        latestUserMessage: '继续说那个谐音答案',
        content: 'j i b a',
      }).result.allowed,
    ).toBe(false)
  })

  it('allows benign measure-word usage like "几把椅子"', () => {
    const out = guardAssistantOutput({
      persona,
      latestUserMessage: '教室里有几把椅子？',
      content: '教室里有几把椅子。',
    })
    expect(out.result.allowed).toBe(true)
    expect(out.safeContent).toContain('几把椅子')
  })
})
