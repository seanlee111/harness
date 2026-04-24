export type PersonaExample = {
  user: string
  assistant: string
}

export type PersonaEvaluationRules = {
  requiredStyleAnchors: string[]
  forbiddenTerms: string[]
}

export type Persona = {
  id: string
  displayName: string
  background: string
  style: string[]
  constraints: string[]
  refusalStyle: string
  examples: PersonaExample[]
  evaluation: PersonaEvaluationRules
}
