# Agent Harness Design Spec

Date: 2026-04-24

Status: Approved design draft, awaiting written spec review.

Reference:
- https://github.com/seanlee111/claude-code-source-code

## Context

This project will build a first-stage CLI agent harness inspired by the referenced Claude Code architecture analysis. The reference separates entrypoints, query lifecycle, agent loop, tools, state, persistence, and harness concerns. This project will borrow that separation, but will keep the first phase smaller: validate a persona-constrained conversational agent and its test harness before adding a full tool system or product UI.

The current local project root is `/Users/bytedance/Desktop/harness`. At spec time it only contains the user-provided `agent.md` workflow file. The target remote repository is `https://github.com/seanlee111/harness.git`; it returned no branch refs during initial inspection, so it appears empty or uninitialized.

## Goals

- Build a CLI REPL agent for multi-turn conversation testing.
- Preserve an API-ready boundary so the same core engine can later power HTTP or Web chat.
- Support config-driven personas plus one built-in example persona.
- Ensure the agent follows the selected persona during normal and adversarial conversations.
- Resist prompt injection attempts such as role reversal, system prompt extraction, instruction override, and malicious style steering.
- Use a Volcengine OpenAI-compatible chat completion API.
- Read API credentials only from environment variables, never from committed config.
- Save manual conversation transcripts for replay and analysis.
- Provide an automated red-team runner with rule assertions by default and optional LLM-as-judge.
- Use Superpowers flow: spec approval, implementation plan approval, TDD, `npm run check` after each module, code review, commit, staged merge, final verification.

## Non-Goals

- No Web UI in the first stage.
- No MCP integration in the first stage.
- No shell execution, file editing tools, browser tools, permission dialogs, sub-agents, or autonomous worktree runtime in the first stage.
- No claim of absolute safety or complete jailbreak resistance.
- No copying of the referenced repository source. The reference is used only for architectural inspiration.
- No live model calls in the default check command, because default checks must pass without network access or API keys.

## Selected Approach

Use a thin `AgentEngine` plus a pluggable harness.

The design mirrors the reference pattern at a smaller scale:

- Entry layer: CLI REPL.
- Query lifecycle layer: `AgentEngine`.
- Harness layer: persona, safety policy, transcript, red-team context, and future tool-loop hooks.
- Model adapter layer: OpenAI-compatible client for Volcengine.
- Evaluation layer: red-team runner, rule evaluator, optional judge.

The first-stage loop is:

1. User input enters CLI.
2. CLI calls `AgentEngine.submitMessage()`.
3. `AgentEngine` appends a user message to session state.
4. Harness builds a model request from persona, policy, and message history.
5. `ModelClient` sends an OpenAI-compatible chat request.
6. `AgentEngine` appends the assistant response.
7. Transcript writer records sanitized events.
8. CLI renders the response, or red-team runner evaluates it.

The engine will reserve event types and interfaces for `tool_use`, `tool_result`, and streaming deltas, but default stage-one behavior has no executable tools.

## Module Boundaries

### `src/cli`

Owns:
- CLI REPL startup.
- User input loop.
- CLI commands such as exit, reset, persona selection, and transcript path display.
- Rendering `AgentEvent` values.

Must not:
- Build model prompts directly.
- Read API keys directly.
- Own persona policy logic.

### `src/core/engine`

Owns:
- `AgentEngine`.
- Session lifecycle and in-memory message history.
- Turn-level orchestration.
- Conversion from model response to engine events.
- Future extension points for tool loop behavior.

Must not:
- Depend on CLI.
- Know Volcengine-specific request details.
- Write transcript files directly except through the transcript port.

### `src/core/harness`

Owns:
- System prompt assembly.
- Persona instruction placement.
- Injection-resistance policy placement.
- Safety and style hierarchy.
- Red-team context handling where needed.

Must not:
- Store API keys.
- Persist transcripts.
- Call the model.

### `src/personas`

Owns:
- Persona config schema.
- Persona loading and validation.
- Built-in example persona.
- Persona evaluation hints used by rule checks.

Must not:
- Invoke the model.
- Mix test-only red-team assertions into runtime persona config.

### `src/model`

Owns:
- `ModelClient` interface.
- Volcengine OpenAI-compatible implementation.
- Request/response normalization.
- API error classification.

Environment contract:
- API key comes from an environment variable, initially named `VOLCENGINE_API_KEY`.
- Base URL and model name may come from config or environment, with environment taking precedence.
- No API key is ever written to logs, transcripts, fixtures, or reports.

### `src/transcript`

Owns:
- JSONL transcript writing.
- Sanitization and redaction.
- Transcript event schema.

Must record:
- User messages.
- Assistant messages.
- Persona id.
- Model name.
- Timestamps.
- Error category where applicable.
- Red-team case id where applicable.

Must not record:
- API keys.
- Full system prompt.
- Hidden harness policy text.

### `src/redteam`

Owns:
- Red-team fixture schema.
- Batch runner.
- Case orchestration through `AgentEngine`.
- Report output.

Initial case categories:
- System prompt extraction.
- Ignore-persona instructions.
- Role reversal.
- Malicious style induction.
- Multi-turn gradual induction.
- Conflicting authority claims.

### `src/evaluator`

Owns:
- Rule-based assertions.
- Optional LLM-as-judge adapter boundary.
- Red-team pass/fail report data.

Default assertions:
- No system prompt disclosure.
- No explicit obedience to injected override instructions.
- No persona out-of-character markers defined by persona config.
- Required persona style anchors appear where the persona says they should.
- Refusals follow the persona's refusal style.

Optional judge:
- Disabled by default.
- Must not run during `npm run check`.
- May use the same `ModelClient` or a separate judge client configuration.

## Interface Contracts

These are conceptual TypeScript contracts for planning and tests. Exact names may change during implementation if the plan documents the change.

```ts
type AgentEngine = {
  submitMessage(input: UserInput): AsyncIterable<AgentEvent>
  reset(session?: SessionInit): void
  getSession(): AgentSession
}
```

```ts
type ModelClient = {
  createChatCompletion(request: ChatRequest): Promise<ChatResponse>
}
```

```ts
type Persona = {
  id: string
  displayName: string
  background: string
  style: string[]
  constraints: string[]
  refusalStyle: string
  examples: PersonaExample[]
  evaluation: PersonaEvaluationRules
}
```

```ts
type RedteamCase = {
  id: string
  title: string
  turns: string[]
  assertions: RuleAssertion[]
}
```

`AgentEvent` must support at least:
- `assistant_message`
- `error`
- `usage`
- `transcript_written`

Future reserved event kinds:
- `partial_delta`
- `tool_use`
- `tool_result`

## Data Flow

1. CLI reads user input.
2. CLI calls `AgentEngine.submitMessage({ content, sessionId })`.
3. `AgentEngine` appends the user message to session state.
4. Harness loads persona and builds a `ChatRequest`.
5. `ModelClient` calls the OpenAI-compatible endpoint.
6. `AgentEngine` appends the assistant message.
7. Transcript writer writes sanitized JSONL events.
8. CLI displays assistant text.
9. Red-team runner reuses the same engine flow and sends outputs to evaluator.

## Error Handling

- Missing API key: fail before live model request and show the required environment variable name.
- Invalid persona config: fail with a structured error including the field path.
- API authentication failure: classify separately from network and server failures.
- API rate limit: classify as retryable but do not hide the error.
- Network failure: show a concise CLI error and record the category in transcript.
- Empty model output: treat as an engine error and record it.
- Transcript write failure: warn during manual CLI use; fail red-team runs.
- Evaluator failure: mark the current case failed and continue other cases.

## Test Strategy

### Unit Tests

- Persona loader accepts valid configs and rejects invalid configs.
- Harness prompt assembly includes persona and policy layers without exposing API keys.
- Harness does not include red-team control-only fields in model-visible prompts.
- Model client reads credentials from environment and builds OpenAI-compatible requests.
- Model client classifies auth, rate limit, network, and server errors.
- Transcript writer emits valid JSONL and redacts secrets.
- Rule evaluator catches system prompt disclosure, injection obedience, OOC markers, and missing style anchors.

### Integration Tests

- Mock `ModelClient` drives `AgentEngine` through multi-turn conversations.
- Engine preserves message order and session state.
- Engine emits stable `AgentEvent` values.
- CLI smoke test verifies startup, one interaction, reset, and exit using a mock model.
- Red-team runner verifies pass/fail report generation with mock model outputs.

### Live Tests

- Live Volcengine tests are excluded from default checks.
- A separate command such as `npm run redteam:live` may use real credentials and network.
- Live tests must fail clearly when required environment variables are missing.

### Quality Gate

`npm run check` must include:
- Type checking.
- Lint or format verification.
- Unit tests.
- Integration tests that use mocks only.

Every completed module must pass `npm run check` before commit or before moving to the next module.

## Worktree And Subagent Plan

Implementation planning will split work by independent module ownership. The exact worktree names and commands will be defined in the implementation plan.

### `foundation`

Owns:
- `package.json`
- TypeScript configuration.
- Vitest/test configuration.
- Check scripts.
- Shared base types in `src/types/**`.

Purpose:
- Establish the project skeleton and contracts other modules consume.

### `persona-harness`

Owns:
- `src/personas/**`
- `src/core/harness/**`
- `personas/**`

Purpose:
- Implement persona schema, built-in example persona, and prompt assembly behavior.

### `engine-model`

Owns:
- `src/core/engine/**`
- `src/model/**`

Purpose:
- Implement session lifecycle, event generation, model adapter, and error classification.

### `cli-transcript`

Owns:
- `src/cli/**`
- `src/transcript/**`

Purpose:
- Implement CLI REPL and sanitized JSONL transcript writing.

### `redteam-evaluator`

Owns:
- `src/redteam/**`
- `src/evaluator/**`
- `redteam/**`

Purpose:
- Implement fixtures, runner, rule evaluator, and optional judge boundary.

Each module must be independently testable. Each module gets focused tests before implementation code under TDD.

## Merge Conflict Risks

- `package.json`: likely touched by scripts and dependencies. Mitigation: `foundation` owns initial edits; later dependency changes require explicit plan checkpoint.
- `src/types/**`: shared contracts may attract edits from all modules. Mitigation: `foundation` owns shared types; other modules keep local types unless a planned contract change is approved.
- `README.md` or docs: likely documentation conflicts. Mitigation: no broad docs edits during parallel module work except designated spec/summary updates.
- Harness and engine boundary: high coupling. Mitigation: contract tests define the boundary before parallel module implementation.
- Persona evaluation fields and red-team assertions: related but separately owned. Mitigation: `persona-harness` owns persona evaluation schema; `redteam-evaluator` consumes public types only.

## Phase Acceptance Criteria

- `npm run check` passes.
- CLI starts and supports at least: default persona, multi-turn conversation, reset, exit.
- Missing API key produces a clear error before live model calls.
- Persona can be changed through config without code changes.
- Transcript JSONL is produced for manual conversations.
- Transcript contains no API key and no full system prompt.
- Red-team runner executes fixture cases and reports pass/fail with reasons.
- Red-team fixtures include at least system prompt extraction, ignore-persona, role reversal, malicious style induction, and multi-turn gradual induction.
- Rule evaluator catches at least one failing fixture in tests.
- Optional LLM-as-judge is represented by an interface and config switch, disabled by default.
- Implementation is completed through the agreed Superpowers flow: plan approval, TDD, checks, code review, commit, staged merge, final verification.

## Repository And Push Policy

- The local directory is initialized as the working repository for this project.
- The remote target is `https://github.com/seanlee111/harness.git`.
- Do not push until the user explicitly asks or confirms a publish step.
- Do not commit implementation code before the spec and implementation plan gates are approved.

## Spec Self-Review Checklist

- Placeholder scan: no placeholders remain.
- Internal consistency: CLI-first scope, API-ready boundary, and no-tool first stage are aligned across all sections.
- Scope check: this is one first-stage implementation plan, not a multi-product platform.
- Ambiguity check: live model tests are explicitly excluded from default checks; API key storage is environment-only; transcript redaction is required.
