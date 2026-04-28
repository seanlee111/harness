import { z } from 'zod'
import type { Persona } from '../types/index.js'

export const personaSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  background: z.string().min(1),
  style: z.array(z.string().min(1)).min(1),
  constraints: z.array(z.string().min(1)).min(1),
  refusalStyle: z.string().min(1),
  examples: z
    .array(
      z.object({
        user: z.string().min(1),
        assistant: z.string().min(1),
      }),
    )
    .default([]),
  evaluation: z.object({
    requiredStyleAnchors: z.array(z.string().min(1)).default([]),
    forbiddenTerms: z.array(z.string().min(1)).default([]),
  }),
})

export function parsePersonaConfig(input: unknown): Persona {
  return personaSchema.parse(input)
}
