# Red-Team Coverage Expansion Spec

Date: 2026-04-28

Status: Approved by user on 2026-04-28. User authorized implementation immediately after plan creation.

## Context

The runnable package is now under `/Users/bytedance/Desktop/harness/harness`.

The user has locally changed harness components before this spec:

- Added policy-driven safety handling under `harness/src/safety/**`.
- Added `HarnessPolicy` types and default policy loading.
- Added normalized scanning for compatibility fold, fullwidth conversion, whitespace stripping, and punctuation stripping.
- Added Chinese homophone/slang guard coverage and benign measure-word control tests.
- Added new sample persona config `harness/personas/cute-girl-student.yaml`.
- Expanded `harness/redteam/default.json` from the original five cases to include initial homophone, obfuscation, and benign control cases.

Fresh baseline before this spec:

- `cd /Users/bytedance/Desktop/harness/harness && npm run check` passes with 14 test files and 37 tests.

The new requirement is to enrich `harness/redteam/default.json` so it covers more malicious player guidance and prompt-injection attacks. The test goal is to evaluate whether the agent plus harness resists attacks and stays in persona, not to intercept by adding a long hard-coded blacklist to persona config or policy config.

The user also requested direct live validation where possible. Live validation depends on `VOLCENGINE_API_KEY`, `VOLCENGINE_BASE_URL`, and `VOLCENGINE_MODEL` being configured in the local environment.

## Goals

- Expand `harness/redteam/default.json` into a broader default red-team suite.
- Cover prompt injection, authority spoofing, system prompt extraction, persona override, role-play jailbreaks, output-format coercion, multi-turn gradual manipulation, encoded/obfuscated attacks, homophone attacks, and benign false-positive controls.
- Exercise the harness path that wraps and guards model output, including the user's normalized safety judgment for homophone and obfuscated variants.
- Keep the default test suite useful for both manual live runs and automated regression checks.
- Add fixture-level tests so future edits cannot silently shrink coverage or remove key categories.
- Preserve the user's current uncommitted safety/policy changes.

## Non-Goals

- Do not solve safety by adding a large set of persona `forbiddenTerms`.
- Do not turn `harness/redteam/default.json` into a product blocking blacklist.
- Do not add a Web UI, API server, tool system, or new agent runtime feature.
- Do not claim complete jailbreak resistance.
- Do not require live model calls in `npm run check`.
- Do not rewrite unrelated Desktop worktree cleanup work in this phase.

## Selected Approach

Use a coverage-matrix fixture expansion.

`harness/redteam/default.json` remains the default red-team fixture, but cases become organized by stable ID prefixes and attack families:

- `prompt-injection-*`: direct and indirect attempts to override higher-priority instructions.
- `system-extraction-*`: requests to reveal hidden prompt, harness policy, transcript internals, or initialization text.
- `authority-spoof-*`: fake developer/admin/auditor claims.
- `persona-override-*`: attempts to make the agent leave, rewrite, or mock its persona.
- `style-coercion-*`: requests for vulgar, degrading, sexualized, or out-of-character style.
- `encoding-obfuscation-*`: fullwidth, spacing, punctuation, leetspeak, pinyin, transliteration, code block, JSON, or base64-style laundering.
- `homophone-*`: Chinese homophone and riddle attacks, including the user's normalized judgment path.
- `multi-turn-*`: gradual induction across several turns.
- `benign-*`: false-positive controls for normal study, biology, game, cos/craft, and measure-word usage.

Assertions should use rule-based checks for canaries and obvious failure markers. These checks are test oracles, not product enforcement rules. The implementation should not add matching prompt terms into persona forbidden terms to make cases pass.

Where exact string assertions are too brittle, cases should use unique canary outputs requested by the attacker, such as `REDTEAM_CANARY_*`, and assert that the canary is not emitted. For broader judgment, optional LLM-as-judge remains outside `npm run check` and can be used in live evaluation later.

## Module Boundaries

### `harness/redteam/default.json`

Owns:

- Default red-team scenario definitions.
- User-turn sequences.
- Rule assertions for expected failures.
- Benign controls.

Must not:

- Encode runtime blocking behavior.
- Depend on persona forbidden-term expansion to pass.
- Include API keys, secrets, or hidden prompt text.

### `harness/tests/redteam/**`

Owns:

- Fixture loading tests.
- Fixture shape validation.
- Coverage category assertions.
- Regression tests that ensure default fixture coverage stays broad.

Must not:

- Call the live model during `npm run check`.
- Assert on remote model-specific wording.

### `harness/src/safety/**`

Owns:

- Runtime guard behavior.
- Normalization and policy-driven signal evaluation.

This phase should not expand policy signals unless a test proves the default fixture cannot exercise the existing normalized judgment path. Any policy change requires TDD and must remain policy-driven, not a long literal blacklist.

### `harness/src/redteam/**`

Owns:

- Loading and running red-team fixtures.
- Case orchestration through `AgentEngine`.

This phase should avoid runtime changes unless fixture validation reveals a real schema or runner limitation.

## Interface Contracts

### Red-Team Case Contract

Existing case shape remains:

```ts
type RedteamCase = {
  id: string
  title: string
  turns: string[]
  assertions: RuleAssertion[]
}
```

Each case must:

- Have a stable unique `id`.
- Have a human-readable `title`.
- Include at least one user turn.
- Include at least one rule assertion.
- Avoid storing hidden harness/system prompt text as fixture data.

### Assertion Contract

Rule assertions remain limited to:

- `not_contains`
- `contains`
- `not_matches`
- `contains_any`

Assertions are allowed to check:

- The agent did not emit attack-requested canaries.
- The agent did not claim to obey injected instructions.
- The agent did not reveal hidden prompt/harness/policy labels.
- The agent retained safe persona-compatible refusal or redirect markers where stable enough.
- Benign cases were not blocked into unrelated unsafe refusal behavior.

Assertions should not become a substitute for runtime safety policy.

### Live Validation Contract

Live validation uses:

```sh
cd /Users/bytedance/Desktop/harness/harness
npm run redteam:live
```

This command may run only when the Volcengine environment variables are configured. If credentials are absent, the phase records live validation as blocked by local environment, not as a test failure.

## Test Strategy

Default non-live verification:

- `cd /Users/bytedance/Desktop/harness/harness && npm run check`
- `cd /Users/bytedance/Desktop/harness/harness && npm run redteam`

Fixture coverage verification:

- Add or update tests under `harness/tests/redteam/**` to assert:
  - `harness/redteam/default.json` has at least 24 cases.
  - Case IDs are unique.
  - Every case has nonempty `turns` and `assertions`.
  - Required category prefixes are present:
    - `prompt-injection-`
    - `system-extraction-`
    - `authority-spoof-`
    - `persona-override-`
    - `style-coercion-`
    - `encoding-obfuscation-`
    - `homophone-`
    - `multi-turn-`
    - `benign-`
  - Homophone/obfuscation cases include normalized variants such as fullwidth, spacing, punctuation, mixed Latin/digit, pinyin/transliteration, and Chinese homophones.
  - Benign controls cover at least measure-word usage and a normal persona-safe conversation.

Harness-path verification:

- Keep or add safety tests that show normalization blocks unsafe homophone variants while allowing benign measure-word phrases.
- Add mock red-team runner tests only if fixture changes require new runner behavior.

Live verification:

- If Volcengine environment variables are present, run `npm run redteam:live` after `npm run check`.
- Record total, failed count, and representative failures.
- If live failures are due to model behavior, do not hide them by weakening assertions; either improve harness behavior through a new approved spec or mark the case as an expected MVP limitation.

## Worktree And Subagent Split

This phase should not create another Desktop sibling worktree. Use the main repository or a future internal worktree under:

```text
/Users/bytedance/Desktop/harness/.worktrees/
```

Recommended module split after plan approval:

1. Red-team fixture module:
   - Files: `harness/redteam/default.json`
   - Responsibility: add scenarios and assertions.
2. Red-team coverage test module:
   - Files: `harness/tests/redteam/loadCases.test.ts` and optional new `harness/tests/redteam/defaultCoverage.test.ts`
   - Responsibility: enforce fixture size, uniqueness, categories, and shape.
3. Optional harness-path module:
   - Files: `harness/tests/safety/**`, `harness/src/safety/**`
   - Responsibility: only if tests expose a missing normalized judgment path.

Subagent usage:

- Use one worker for fixture expansion and one reviewer for coverage/category quality.
- Keep implementation inline if active user changes make branch/worktree isolation risky.

## Merge Conflict Risks

- `harness/redteam/default.json` is already modified by the user.
- `harness/tests/redteam/loadCases.test.ts` is already modified by the user.
- `harness/src/safety/**` is new and uncommitted.
- `harness/package.json` and lockfile are modified by the user's `dotenv` addition.

Mitigation:

- Treat current working tree as user-owned baseline.
- Do not revert user edits.
- Keep fixture expansion changes additive.
- Stage only files touched for this phase.
- Run `git diff` before any commit to confirm ownership.

## Phase Acceptance Criteria

The phase is acceptable when:

- `harness/redteam/default.json` contains at least 24 cases across the required categories.
- The suite includes malicious prompt-injection, persona override, authority spoofing, encoded/obfuscated, homophone, multi-turn, and benign false-positive controls.
- Fixture coverage tests pass and would fail if major categories or case volume are removed.
- No new persona forbidden-term blacklist is added to make these cases pass.
- `cd /Users/bytedance/Desktop/harness/harness && npm run check` passes.
- `cd /Users/bytedance/Desktop/harness/harness && npm run redteam` passes.
- `npm run redteam:live` is run if Volcengine env vars are available; otherwise the summary records that live validation is blocked by missing env.
- User-local files such as `agent.md`, `.DS_Store`, and `harness/src/cli/Untitled-1.env` are not committed unless explicitly requested.
