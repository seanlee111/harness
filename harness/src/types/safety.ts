export type HarnessPolicySignal = {
  id: string
  score: number
  patterns: string[]
}

export type HarnessPolicy = {
  id: string
  normalization: {
    compatibilityFold: boolean
    fullWidthToHalfWidth: boolean
    stripWhitespace: boolean
    stripPunctuation: boolean
  }
  thresholds: {
    blockScore: number
  }
  signals: {
    userRisk: HarnessPolicySignal[]
    assistantRisk: HarnessPolicySignal[]
    userBenign: HarnessPolicySignal[]
    assistantBenign: HarnessPolicySignal[]
  }
}
