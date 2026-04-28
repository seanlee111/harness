# Directory Layout Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the runnable TypeScript agent harness package into `harness/` while preserving CLI, tests, fixture paths, and repository documentation.

**Architecture:** The repository root remains the Git and documentation boundary. The nested `harness/` directory becomes the only Node package boundary, containing source, tests, package metadata, runtime fixtures, and package-local tool configuration.

**Tech Stack:** Git worktrees, Node.js 20+, TypeScript, Vitest, Prettier, tsx, npm scripts, shell path audits.

---

## Execution Rules

- Do not start implementation until this plan is approved by the user.
- Use `task/directory-layout` in `../harness-directory-layout`.
- Use TDD: add path-index tests first, run them from the current root, and observe the expected failure before moving files.
- Run `npm run check` from the nested package after the move.
- If any check fails, use `superpowers:systematic-debugging` before changing files.
- Run a spec compliance review and a code quality review before committing.
- Do not push to `origin` until the user explicitly confirms publishing.
- Keep root `agent.md` untracked and untouched.

## Worktree, Subagent, And Ownership

This is one independently testable module.

| Branch | Worktree | Module | File Ownership |
|---|---|---|---|
| `task/directory-layout` | `../harness-directory-layout` | directory-layout | `package.json`, `package-lock.json`, `src/**`, `tests/**`, `personas/**`, `redteam/**`, `tsconfig.json`, `vitest.config.ts`, `.prettierrc.json`, `.prettierignore`, `README.md`, `.gitignore`, `docs/superpowers/plans/2026-04-28-directory-layout.md`, later summary doc |

Subagent workflow:

- Worker: perform the move, test additions, README updates, and verification.
- Reviewer 1: spec compliance and path-index coverage.
- Reviewer 2: code quality and repository hygiene.

If subagents are unavailable, execute inline with the same worker/reviewer gates.

## Target File Map

```text
/Users/bytedance/Desktop/harness/
  .gitignore
  README.md
  agent.md                         # untracked, untouched
  docs/superpowers/**
  harness/
    .prettierignore
    .prettierrc.json
    package-lock.json
    package.json
    personas/default.yaml
    redteam/default.json
    src/**
    tests/**
    tsconfig.json
    vitest.config.ts
```

## Task 1: Path Tests And Package Move

**Files:**
- Move: `package.json` -> `harness/package.json`
- Move: `package-lock.json` -> `harness/package-lock.json`
- Move: `src/**` -> `harness/src/**`
- Move: `tests/**` -> `harness/tests/**`
- Move: `personas/**` -> `harness/personas/**`
- Move: `redteam/**` -> `harness/redteam/**`
- Move: `tsconfig.json` -> `harness/tsconfig.json`
- Move: `vitest.config.ts` -> `harness/vitest.config.ts`
- Move: `.prettierrc.json` -> `harness/.prettierrc.json`
- Move: `.prettierignore` -> `harness/.prettierignore`
- Modify: `README.md`
- Verify: `.gitignore`
- Create before move: `tests/foundation/directoryLayout.test.ts`
- Modify before move: `tests/personas/loadPersona.test.ts`
- Create before move: `tests/redteam/loadCases.test.ts`

- [ ] **Step 1: Create the worktree**

```bash
git worktree add -b task/directory-layout ../harness-directory-layout main
cd ../harness-directory-layout
```

Expected: command exits 0 and prints `Preparing worktree`.

- [ ] **Step 2: Run the current baseline check**

```bash
npm run check
```

Expected: exit 0 with Vitest reporting 10 passed test files and 27 passed tests.

- [ ] **Step 3: Add the failing directory layout regression test**

Create `tests/foundation/directoryLayout.test.ts`:

```ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('directory layout', () => {
  it('runs from a nested package root with repository docs above it', () => {
    const packageRoot = process.cwd()
    const repositoryRoot = join(packageRoot, '..')

    expect(existsSync(join(packageRoot, 'package.json'))).toBe(true)
    expect(existsSync(join(packageRoot, 'src'))).toBe(true)
    expect(existsSync(join(packageRoot, 'tests'))).toBe(true)
    expect(existsSync(join(packageRoot, 'personas', 'default.yaml'))).toBe(true)
    expect(existsSync(join(packageRoot, 'redteam', 'default.json'))).toBe(true)
    expect(existsSync(join(repositoryRoot, 'docs', 'superpowers'))).toBe(true)
    expect(existsSync(join(repositoryRoot, 'package.json'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'src'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'tests'))).toBe(false)
  })
})
```

- [ ] **Step 4: Add fixture path assertions**

Append this test to `tests/personas/loadPersona.test.ts` inside the existing `describe('loadPersona', () => { ... })` block:

```ts
  it('loads the package-local default YAML persona by relative path', async () => {
    const persona = await loadPersona({ personaPath: 'personas/default.yaml' })

    expect(persona.id).toBe('default')
    expect(persona.displayName).toBe('Ming')
  })
```

Create `tests/redteam/loadCases.test.ts`:

```ts
import { loadRedteamCases } from '../../src/redteam/loadCases.js'

describe('loadRedteamCases', () => {
  it('loads the package-local default red-team fixture by relative path', async () => {
    const cases = await loadRedteamCases('redteam/default.json')

    expect(cases.map((testCase) => testCase.id)).toEqual([
      'system-prompt-extraction',
      'ignore-persona',
      'role-reversal',
      'malicious-style-induction',
      'multi-turn-gradual-induction',
    ])
  })
})
```

- [ ] **Step 5: Run the new tests and verify the red state**

```bash
npm test -- \
  tests/foundation/directoryLayout.test.ts \
  tests/personas/loadPersona.test.ts \
  tests/redteam/loadCases.test.ts
```

Expected: exit 1. The failure must come from `tests/foundation/directoryLayout.test.ts`, where `../docs/superpowers` is missing because the package is still running from the repository root.

- [ ] **Step 6: Move the runnable package files into `harness/`**

```bash
mkdir harness
git mv package.json package-lock.json src tests personas redteam tsconfig.json vitest.config.ts .prettierrc.json .prettierignore harness/
```

Expected: command exits 0. `git status --short` shows renamed paths into `harness/`.

- [ ] **Step 7: Install dependencies in the nested package**

```bash
cd harness
npm install
```

Expected: command exits 0. `harness/package-lock.json` remains the lockfile and `harness/node_modules/` exists in the worktree.

- [ ] **Step 8: Verify the moved tests pass**

```bash
npm test -- \
  tests/foundation/directoryLayout.test.ts \
  tests/personas/loadPersona.test.ts \
  tests/redteam/loadCases.test.ts
```

Expected: exit 0. The directory layout test proves repository docs are above the package root and runtime fixtures are inside the package root.

- [ ] **Step 9: Update the root README command boundary**

From the repository root, replace `README.md` with:

```md
# Agent Harness

CLI-first persona agent harness for testing persona adherence and prompt-injection resistance.

The runnable Node.js package lives in [`harness/`](./harness). Repository-level planning and phase documents live in [`docs/superpowers/`](./docs/superpowers).

## Requirements

- Node.js 20+
- Volcengine OpenAI-compatible chat completion endpoint

## Setup

```bash
cd harness
npm install
```

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
cd harness
npm run check
npm run cli
npm run redteam:live
```

Default checks use mock tests only and do not require network or API credentials.

Run the dry red-team command without live model calls:

```bash
cd harness
npm run redteam
```

## CLI Commands

- `/reset` resets the current session.
- `/exit` exits the REPL.

## Transcript Policy

Transcripts are written under `harness/transcripts/`, which is ignored by git. API keys and configured secrets are redacted. Full system prompts and hidden harness policy text are not recorded.
```

- [ ] **Step 10: Verify root ignore coverage**

Keep `.gitignore` at the repository root with this content:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
transcripts/
reports/
*.log
```

Run:

```bash
cd /Users/bytedance/Desktop/harness-directory-layout
git check-ignore harness/node_modules/.package-lock.json
git check-ignore harness/transcripts/example.jsonl
git check-ignore harness/reports/example.json
```

Expected: each command exits 0 and prints the ignored path.

- [ ] **Step 11: Run the full nested package check**

```bash
cd /Users/bytedance/Desktop/harness-directory-layout/harness
npm run check
```

Expected: exit 0. TypeScript, Prettier, and Vitest all pass.

- [ ] **Step 12: Run red-team dry-run from the nested package**

```bash
cd /Users/bytedance/Desktop/harness-directory-layout/harness
npm run redteam
```

Expected: exit 0 and prints `Use npm run redteam:live to run against the configured live model.`

- [ ] **Step 13: Run the CLI missing-env smoke test from the nested package**

```bash
cd /Users/bytedance/Desktop/harness-directory-layout/harness
set +e
env -u VOLCENGINE_API_KEY -u VOLCENGINE_BASE_URL -u VOLCENGINE_MODEL npm run cli > /tmp/harness-cli-smoke.out 2>&1
cli_status=$?
set -e
test "$cli_status" -eq 1
rg "VOLCENGINE_API_KEY" /tmp/harness-cli-smoke.out
! rg "at .*\\(" /tmp/harness-cli-smoke.out
```

Expected: final command sequence exits 0. Output mentions the missing `VOLCENGINE_API_KEY` and contains no stack trace.

- [ ] **Step 14: Run stale path and root cleanliness audits**

```bash
cd /Users/bytedance/Desktop/harness-directory-layout
test ! -e package.json
test ! -e package-lock.json
test ! -d src
test ! -d tests
test ! -d personas
test ! -d redteam
test ! -e tsconfig.json
test ! -e vitest.config.ts
test -f harness/package.json
test -d harness/src
test -d harness/tests
test -f harness/personas/default.yaml
test -f harness/redteam/default.json
test -d docs/superpowers
rg -n "npm run (check|cli|redteam)" README.md
```

Expected: all `test` commands exit 0. The `rg` output only appears in README command examples that first run `cd harness` or explicitly discuss the nested package.

- [ ] **Step 15: Review the diff for ownership and accidental user-file movement**

```bash
cd /Users/bytedance/Desktop/harness-directory-layout
git status --short
git diff --stat
git diff -- README.md harness/tests/foundation/directoryLayout.test.ts harness/tests/personas/loadPersona.test.ts harness/tests/redteam/loadCases.test.ts
test ! -e harness/agent.md
```

Expected: status shows only intended moved files, README/test updates, and the plan/spec docs. `harness/agent.md` does not exist.

- [ ] **Step 16: Code review gate**

Review checklist:

- The package can be operated entirely from `harness/`.
- No runtime code depends on files outside `harness/`.
- The new tests fail before the move and pass after the move.
- README commands no longer imply running npm from the repository root.
- `.gitignore` still ignores nested `harness/node_modules`, `harness/transcripts`, and `harness/reports`.
- Historical docs from the first phase are not rewritten just to update old paths.

- [ ] **Step 17: Commit the implementation branch**

```bash
git add README.md .gitignore docs/superpowers/specs/2026-04-28-directory-layout-design.md docs/superpowers/plans/2026-04-28-directory-layout.md harness
git commit -m "chore: move package into harness directory"
```

Expected: commit succeeds. Do not push.

## Task 2: Merge And Phase Acceptance

**Files:**
- Create after merge: `docs/superpowers/summaries/2026-04-28-directory-layout-phase-1.md`

- [ ] **Step 1: Re-run the branch check before merge**

```bash
cd /Users/bytedance/Desktop/harness-directory-layout/harness
npm run check
```

Expected: exit 0.

- [ ] **Step 2: Merge the implementation branch into main**

```bash
cd /Users/bytedance/Desktop/harness
git merge --no-ff task/directory-layout
```

Expected: merge exits 0. Resolve conflicts only if they are in the planned file ownership set.

- [ ] **Step 3: Move the old ignored dependency directory out of the repository root**

```bash
cd /Users/bytedance/Desktop/harness
if [ -d node_modules ] && [ ! -e harness/node_modules ]; then
  mv node_modules harness/node_modules
fi
```

Expected: repository root no longer has `node_modules/` when it existed only as the old package dependency directory.

- [ ] **Step 4: Refresh nested package dependencies**

```bash
cd /Users/bytedance/Desktop/harness/harness
npm install
```

Expected: exit 0 and no unintended package manifest changes beyond the moved lockfile.

- [ ] **Step 5: Run full post-merge verification**

```bash
cd /Users/bytedance/Desktop/harness/harness
npm run check
npm run redteam
set +e
env -u VOLCENGINE_API_KEY -u VOLCENGINE_BASE_URL -u VOLCENGINE_MODEL npm run cli > /tmp/harness-cli-smoke-main.out 2>&1
cli_status=$?
set -e
test "$cli_status" -eq 1
rg "VOLCENGINE_API_KEY" /tmp/harness-cli-smoke-main.out
! rg "at .*\\(" /tmp/harness-cli-smoke-main.out
```

Expected: all verification commands exit 0 under the rules above.

- [ ] **Step 6: Run post-merge path audits**

```bash
cd /Users/bytedance/Desktop/harness
test ! -e package.json
test ! -d src
test -f harness/package.json
test -d harness/src
test -d docs/superpowers
test ! -e harness/agent.md
git status --short --branch
```

Expected: path tests exit 0. Git status shows the merge result plus untracked `agent.md`; no other untracked root package files appear.

- [ ] **Step 7: Write the phase summary**

Create `docs/superpowers/summaries/2026-04-28-directory-layout-phase-1.md`:

```md
# Directory Layout Reorganization Phase 1 Summary

Date: 2026-04-28

## Scope

Moved the runnable TypeScript package into `harness/` and kept repository-level docs at the root.

## Verification

- `cd harness && npm run check`
- `cd harness && npm run redteam`
- `cd harness && env -u VOLCENGINE_API_KEY -u VOLCENGINE_BASE_URL -u VOLCENGINE_MODEL npm run cli`
- Repository root path audit for moved package files

## Acceptance Notes

- Runtime package files live under `harness/`.
- Root `README.md` documents the nested package command boundary.
- Default persona and red-team fixture paths are covered by tests.
- `agent.md` remains untracked and unmoved.
```

- [ ] **Step 8: Commit the phase summary**

```bash
cd /Users/bytedance/Desktop/harness
git add docs/superpowers/summaries/2026-04-28-directory-layout-phase-1.md
git commit -m "docs: summarize directory layout reorganization"
```

Expected: commit succeeds.

- [ ] **Step 9: Stop for user phase acceptance**

Report:

- Implementation commit hash.
- Summary commit hash.
- Verification command outputs.
- Whether `agent.md` remains untracked.
- Whether the branch has been pushed.

Do not push to GitHub or clean worktrees until the user confirms.
