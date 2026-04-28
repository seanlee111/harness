import { AgentEngine } from '../core/engine/AgentEngine.js'
import { createVolcengineModelClient } from '../model/volcengineClient.js'
import { loadVolcengineConfig } from '../model/volcengineConfig.js'
import { loadPersona } from '../personas/loadPersona.js'
import { createJsonlTranscriptWriter } from '../transcript/jsonlWriter.js'
import { runCli } from './runCli.js'

async function main(): Promise<void> {
  const config = loadVolcengineConfig()
  const persona = await loadPersona({ personaPath: process.env.PERSONA_PATH })
  const transcript = createJsonlTranscriptWriter({
    filePath: `transcripts/${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`,
    secrets: [config.apiKey],
  })
  const engine = new AgentEngine({
    persona,
    model: config.model,
    modelClient: createVolcengineModelClient(config),
    transcript,
  })

  await runCli({ input: process.stdin, output: process.stdout, engine })
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
