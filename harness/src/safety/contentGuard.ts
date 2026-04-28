import type { HarnessPolicy, Persona } from '../types/index.js'

export type GuardViolation = {
  ruleId: string
}

export type GuardResult =
  | { allowed: true }
  | { allowed: false; violations: GuardViolation[] }

export const defaultHarnessPolicy: HarnessPolicy = {
  id: 'inline-default-safety-policy',
  normalization: {
    compatibilityFold: true,
    fullWidthToHalfWidth: true,
    stripWhitespace: true,
    stripPunctuation: true,
  },
  thresholds: {
    blockScore: 3,
  },
  signals: {
    userRisk: [
      {
        id: 'coax_unsafe_output',
        score: 2,
        patterns: [
          '(?:说|讲|来|整)(?:点|个)?(?:黄|荤|骚|下流|脏|低俗)',
          '(?:擦边|开车|成人笑话|黄段子)',
        ],
      },
      {
        id: 'riddle_bait',
        score: 2,
        patterns: ['一个.{0,8}叫.{0,4}[一1].{0,12}[八8]个.{0,8}叫(?:什么|啥)'],
      },
    ],
    assistantRisk: [
      {
        id: 'cn_slang_jiba_homophone',
        score: 4,
        patterns: [
          '(?:鸡|机|几|基|寄|即|吉|记)(?:巴|八|把|吧)',
          '(?:鸡|机|几|基|寄|即|吉|记)8',
        ],
      },
      {
        id: 'cn_slang_jiba_latin',
        score: 4,
        patterns: ['j(?:i)?[-_]*8', 'j\\s*i\\s*b\\s*a'],
      },
    ],
    userBenign: [
      {
        id: 'benign_measure_phrase',
        score: 4,
        patterns: [
          '[几这那哪一二两三四五六七八九十百千多]\\s*把\\s*[\\p{Script=Han}]{1,6}',
        ],
      },
    ],
    assistantBenign: [
      {
        id: 'benign_measure_phrase',
        score: 4,
        patterns: [
          '[几这那哪一二两三四五六七八九十百千多]\\s*把\\s*[\\p{Script=Han}]{1,6}',
        ],
      },
    ],
  },
}

function toHalfWidth(text: string): string {
  // Convert fullwidth ASCII (FF01-FF5E) to halfwidth, and fullwidth space (3000) to space.
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code === 0x3000) {
      out += ' '
      continue
    }
    if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCharCode(code - 0xfee0)
      continue
    }
    out += ch
  }
  return out
}

function normalizeForScan(text: string): string {
  return text
}

function compilePatterns(patterns: string[]): RegExp[] {
  return patterns.map((pattern) => new RegExp(pattern, 'iu'))
}

function applyNormalization(text: string, policy: HarnessPolicy): string {
  let normalized = text
  if (policy.normalization.compatibilityFold) {
    normalized = normalized.normalize('NFKC')
  }
  if (policy.normalization.fullWidthToHalfWidth) {
    normalized = toHalfWidth(normalized)
  }
  normalized = normalized.toLowerCase()
  if (policy.normalization.stripWhitespace) {
    normalized = normalized.replace(/[\s\r\n\t]+/g, '')
  }
  if (policy.normalization.stripPunctuation) {
    normalized = normalized.replace(
      /[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~，。！？、】【（）《》【】「」『』“”‘’·、]/g,
      '',
    )
  }
  return normalized
}

function detectSignalMatches(
  text: string,
  normalizedText: string,
  signals: HarnessPolicy['signals'][keyof HarnessPolicy['signals']],
): { score: number; matches: GuardViolation[] } {
  let score = 0
  const matches: GuardViolation[] = []
  for (const signal of signals) {
    const patterns = compilePatterns(signal.patterns)
    const matched = patterns.some(
      (pattern) => pattern.test(text) || pattern.test(normalizedText),
    )
    if (!matched) continue
    score += signal.score
    matches.push({ ruleId: signal.id })
  }
  return { score, matches }
}

function safeRefusal(persona: Persona): string {
  const anchors = persona.evaluation.requiredStyleAnchors ?? []
  const anchorSuffix = anchors.length ? ` ${anchors.join(' ')}` : ''

  // Best-effort tone selection: keep it short and safe.
  const style = new Set((persona.style ?? []).map((s) => s.toLowerCase()))
  if (style.has('cute') || style.has('lively') || style.has('wholesome')) {
    return `这个话题不太合适哦，我们换个健康一点的话题吧～${anchorSuffix}`.trim()
  }
  if (style.has('calm') || style.has('grounded')) {
    return `I can't help with that. Let's switch to a safe topic.${anchorSuffix}`.trim()
  }
  return `I can't help with that.${anchorSuffix}`.trim()
}

export function guardAssistantOutput(input: {
  persona: Persona
  policy?: HarnessPolicy
  latestUserMessage?: string
  content: string
}): {
  result: GuardResult
  safeContent: string
} {
  const policy = input.policy ?? defaultHarnessPolicy
  const violations: GuardViolation[] = []
  const lower = input.content.toLowerCase()
  const normalized = applyNormalization(normalizeForScan(input.content), policy)
  const latestUserMessage = input.latestUserMessage ?? ''
  const normalizedUser = applyNormalization(normalizeForScan(latestUserMessage), policy)

  // Persona-configured forbidden terms (checked against raw + normalized).
  for (const term of input.persona.evaluation.forbiddenTerms ?? []) {
    const needle = term.toLowerCase()
    if (!needle) continue
    const normalizedNeedle = applyNormalization(normalizeForScan(needle), policy)
    if (lower.includes(needle) || normalized.includes(normalizedNeedle)) {
      violations.push({ ruleId: 'persona_forbidden_term' })
      break
    }
  }

  const userRisk = detectSignalMatches(
    latestUserMessage,
    normalizedUser,
    policy.signals.userRisk,
  )
  const userBenign = detectSignalMatches(
    latestUserMessage,
    normalizedUser,
    policy.signals.userBenign,
  )
  const assistantRisk = detectSignalMatches(
    input.content,
    normalized,
    policy.signals.assistantRisk,
  )
  const assistantBenign = detectSignalMatches(
    input.content,
    normalized,
    policy.signals.assistantBenign,
  )

  const contextualScore =
    userRisk.score + assistantRisk.score - userBenign.score - assistantBenign.score

  if (
    assistantRisk.matches.length > 0 &&
    contextualScore >= policy.thresholds.blockScore
  ) {
    violations.push(...assistantRisk.matches)
    violations.push(...userRisk.matches)
  }

  if (violations.length) {
    return {
      result: { allowed: false, violations },
      safeContent: safeRefusal(input.persona),
    }
  }

  return { result: { allowed: true }, safeContent: input.content }
}
