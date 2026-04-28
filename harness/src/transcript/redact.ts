export function redactText(value: string, secrets: string[]): string {
  return secrets
    .filter((secret) => secret.length > 0)
    .reduce((text, secret) => text.split(secret).join('[REDACTED]'), value)
}
