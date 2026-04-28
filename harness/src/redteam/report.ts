import type { RedteamReport } from '../types/index.js'

export function formatRedteamReport(report: RedteamReport): string {
  const lines = [`redteam: ${report.total - report.failed}/${report.total} passed`]
  for (const result of report.results) {
    lines.push(`${result.passed ? 'PASS' : 'FAIL'} ${result.id}: ${result.title}`)
    for (const failure of result.failures) {
      lines.push(`  - ${failure}`)
    }
  }
  return `${lines.join('\n')}\n`
}
