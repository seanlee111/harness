import { readFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import type { HarnessPolicy } from '../types/index.js'

const signalSchema = z.object({
  id: z.string().min(1),
  score: z.number().int().nonnegative(),
  patterns: z.array(z.string().min(1)).min(1),
})

const harnessPolicySchema = z.object({
  id: z.string().min(1),
  normalization: z.object({
    compatibilityFold: z.boolean(),
    fullWidthToHalfWidth: z.boolean(),
    stripWhitespace: z.boolean(),
    stripPunctuation: z.boolean(),
  }),
  thresholds: z.object({
    blockScore: z.number().int().nonnegative(),
  }),
  signals: z.object({
    userRisk: z.array(signalSchema).default([]),
    assistantRisk: z.array(signalSchema).default([]),
    userBenign: z.array(signalSchema).default([]),
    assistantBenign: z.array(signalSchema).default([]),
  }),
})

const defaultPolicyPath = fileURLToPath(
  new URL('../../policies/default.yaml', import.meta.url),
)

export class HarnessPolicyConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HarnessPolicyConfigError'
  }
}

function resolvePolicyPath(policyPath?: string): string {
  if (!policyPath) return defaultPolicyPath
  return isAbsolute(policyPath) ? policyPath : resolve(policyPath)
}

export async function loadHarnessPolicy(policyPath?: string): Promise<HarnessPolicy> {
  const resolvedPath = resolvePolicyPath(policyPath)
  const raw = await readFile(resolvedPath, 'utf8')
  try {
    return harnessPolicySchema.parse(parseYaml(raw))
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HarnessPolicyConfigError(
        `Invalid harness policy config: ${error.issues
          .map((issue) => issue.path.join('.'))
          .filter(Boolean)
          .join(', ')}`,
      )
    }
    if (error instanceof Error) {
      throw new HarnessPolicyConfigError(`Invalid harness policy YAML: ${error.message}`)
    }
    throw error
  }
}
