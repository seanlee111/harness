import 'dotenv/config'

import { AgentEngine } from '../core/engine/AgentEngine.js'
import { createVolcengineModelClient } from '../model/volcengineClient.js'
import { loadVolcengineConfig } from '../model/volcengineConfig.js'
import { loadPersona } from '../personas/loadPersona.js'
import { loadHarnessPolicy } from '../safety/loadHarnessPolicy.js'
import { createJsonlTranscriptWriter } from '../transcript/jsonlWriter.js'
import { loadRedteamCases } from './loadCases.js'
import { formatRedteamReport } from './report.js'
import { runRedteam } from './runRedteam.js'

async function main(): Promise<void> {
  const live = process.argv.includes('--live') || process.env.LIVE_MODEL === '1'
  if (!live) {
    process.stderr.write(
      'Use npm run redteam:live to run against the configured live model.\n',
    )
    return
  }

  const config = loadVolcengineConfig()
  const persona = await loadPersona({ personaPath: process.env.PERSONA_PATH })
  const harnessPolicy = await loadHarnessPolicy(process.env.HARNESS_POLICY_PATH)
  const cases = await loadRedteamCases(
    process.env.REDTEAM_CASES ?? 'redteam/default.json',
  )
  const report = await runRedteam({
    persona,
    cases,
    createEngine() {
      return new AgentEngine({
        persona,
        harnessPolicy,
        model: config.model,
        modelClient: createVolcengineModelClient(config),
        transcript: createJsonlTranscriptWriter({
          filePath: `transcripts/redteam-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`,
          secrets: [config.apiKey],
        }),
      })
    },
  })

  process.stdout.write(formatRedteamReport(report))
  process.exitCode = report.passed ? 0 : 1
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
