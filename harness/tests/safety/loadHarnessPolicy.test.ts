import { loadHarnessPolicy } from '../../src/safety/loadHarnessPolicy.js'

describe('loadHarnessPolicy', () => {
  it('loads the default policy file', async () => {
    const policy = await loadHarnessPolicy()

    expect(policy.id).toBe('default-safety-policy')
    expect(policy.thresholds.blockScore).toBe(3)
    expect(policy.signals.assistantRisk.length).toBeGreaterThan(0)
    expect(policy.signals.assistantBenign.length).toBeGreaterThan(0)
  })
})
