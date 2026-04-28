# Agent Harness

CLI-first persona agent harness for testing persona adherence and prompt-injection resistance.

## Requirements

- Node.js 20+
- Volcengine OpenAI-compatible chat completion endpoint

## Environment

```bash
export VOLCENGINE_API_KEY="your-key"
export VOLCENGINE_BASE_URL="https://your-openai-compatible-base-url"
export VOLCENGINE_MODEL="your-model-name"
```

Optional:

```bash
export PERSONA_PATH="personas/default.yaml"
export REDTEAM_CASES="redteam/default.json"
```

## Commands

```bash
npm run check
npm run cli
npm run redteam:live
```

Default checks use mock tests only and do not require network or API credentials.

## CLI Commands

- `/reset` resets the current session.
- `/exit` exits the REPL.

## Transcript Policy

Transcripts are written under `transcripts/`, which is ignored by git. API keys and configured secrets are redacted. Full system prompts and hidden harness policy text are not recorded.
