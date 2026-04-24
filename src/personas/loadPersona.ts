import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import { ZodError } from 'zod'
import type { Persona } from '../types/index.js'
import { builtInPersonas } from './builtIn.js'
import { parsePersonaConfig } from './personaSchema.js'

export class PersonaConfigError extends Error {
  readonly fieldPaths: string[]

  constructor(message: string, fieldPaths: string[]) {
    super(message)
    this.name = 'PersonaConfigError'
    this.fieldPaths = fieldPaths
  }
}

export type LoadPersonaOptions = {
  personaPath?: string
  personaId?: string
}

function zodPaths(error: ZodError): string[] {
  return error.issues.map((issue) => issue.path.join('.')).filter(Boolean)
}

export async function loadPersona(options: LoadPersonaOptions): Promise<Persona> {
  if (options.personaPath) {
    const raw = await readFile(options.personaPath, 'utf8')
    const parsed = parseYaml(raw)
    try {
      return parsePersonaConfig(parsed)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new PersonaConfigError('Invalid persona config', zodPaths(error))
      }
      throw error
    }
  }

  const personaId = options.personaId ?? 'default'
  const persona = builtInPersonas[personaId]
  if (!persona) {
    throw new PersonaConfigError(`Unknown built-in persona: ${personaId}`, ['personaId'])
  }
  return persona
}
