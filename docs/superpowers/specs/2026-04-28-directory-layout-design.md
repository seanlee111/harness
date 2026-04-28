# Directory Layout Reorganization Spec

Date: 2026-04-28

Status: Draft, awaiting user review.

## Context

The current repository root mixes the runnable TypeScript package with repository-level material. Runtime files such as `package.json`, `src/`, `tests/`, `personas/`, `redteam/`, `tsconfig.json`, and `vitest.config.ts` sit directly beside project docs, Git metadata, and the user-local `agent.md` note.

The user selected "方案 A": create a `harness/` subdirectory and move the runnable project into it. The repository root remains the Git and documentation boundary, while `harness/` becomes the package boundary for CLI development, tests, and future API code.

## Goals

- Move the runnable agent harness package into `/Users/bytedance/Desktop/harness/harness`.
- Keep repository-level docs and local workflow notes at the repository root.
- Preserve all CLI, red-team, test, and package behavior after the move.
- Update path references so imports, test fixtures, config loading, README commands, and ignore rules still work.
- Add or adjust tests that detect path-index regressions caused by the new package root.
- Keep the remote `main` branch history linear and reviewable for this reorganization.

## Non-Goals

- No functional changes to agent behavior, persona rules, model client behavior, evaluator logic, or transcript schemas.
- No Web UI, HTTP API, tool system, or new product feature.
- No migration to a monorepo package manager.
- No rename of the repository itself.
- No inclusion of the local untracked `agent.md` file in Git.
- No cleanup of old task worktrees unless requested separately.

## Selected Approach

Use a direct package-root move:

- Create `harness/`.
- Move the Node package files into `harness/`.
- Keep root-level documentation under `docs/`.
- Keep root `README.md` as the repository entry document and update commands to run from `harness/`.
- Keep `.gitignore` at the repository root, updating patterns if needed for `harness/node_modules`, `harness/dist`, transcript output, and reports.

The new high-level structure should be:

```text
/Users/bytedance/Desktop/harness/
  .git/
  .gitignore
  README.md
  agent.md                 # untracked local note, untouched
  docs/
  harness/
    package.json
    package-lock.json
    src/
    tests/
    personas/
    redteam/
    tsconfig.json
    vitest.config.ts
    .prettierrc.json
    .prettierignore
```

## Module Boundaries

### Repository Root

Owns:

- Git repository boundary.
- `README.md` as the entrypoint for humans landing on the repo.
- `docs/superpowers/**` specs, plans, and summaries.
- `.gitignore`.
- User-local, untracked workflow notes such as `agent.md`.

Must not:

- Own runtime TypeScript source.
- Own package scripts.
- Own test configuration.
- Require `npm install` from the repository root.

### `harness/`

Owns:

- Runtime package metadata and lockfile.
- TypeScript source under `harness/src`.
- Tests under `harness/tests`.
- Persona fixtures under `harness/personas`.
- Red-team fixtures under `harness/redteam`.
- TypeScript, Vitest, Prettier, and package script configuration.

Must not:

- Contain Superpowers project docs.
- Depend on files outside `harness/` for default tests, CLI startup, or red-team dry-run.
- Read or commit `agent.md`.

### Runtime Modules

The existing runtime module ownership remains unchanged inside the new package root:

- `harness/src/cli`
- `harness/src/core/engine`
- `harness/src/core/harness`
- `harness/src/model`
- `harness/src/personas`
- `harness/src/transcript`
- `harness/src/redteam`
- `harness/src/evaluator`
- `harness/src/types`

## Interface Contracts

### Command Boundary

Commands that previously ran from the repository root will now run from the package root:

```sh
cd harness
npm run check
npm run cli
npm run redteam
npm run redteam:live
```

The repository root `README.md` must document this clearly.

### Package Boundary

`harness/package.json` remains the canonical package manifest. Existing scripts should continue to work from inside `harness/` without extra environment variables or root-relative assumptions.

### Config and Fixture Paths

Runtime defaults must resolve relative to the package working directory unless an explicit path is passed:

- Default persona fixture: `personas/default.yaml`.
- Default red-team fixture: `redteam/default.json`.
- Test files: `tests/**`.
- Transcript/report outputs: package-local paths unless the caller supplies an absolute path.

Tests should cover the most important default path lookups after the move.

### Public Exports

`harness/src/index.ts` remains the public TypeScript export surface. Internal import paths must continue to resolve after relocation.

### Git Boundary

The root repository remains at `/Users/bytedance/Desktop/harness`. Git commands, commits, and pushes still run from the repository root unless a command explicitly needs the package working directory.

## Test Strategy

The implementation must verify both behavior and path indexing:

- Run `npm run check` from `/Users/bytedance/Desktop/harness/harness`.
- Run `npm run redteam` from `/Users/bytedance/Desktop/harness/harness`.
- Run the CLI missing-env smoke test from `/Users/bytedance/Desktop/harness/harness`:

```sh
env -u VOLCENGINE_API_KEY -u VOLCENGINE_BASE_URL -u VOLCENGINE_MODEL npm run cli
```

Expected result: exits non-zero with a missing `VOLCENGINE_API_KEY` error and no stack trace.

- Add or update tests to ensure default persona and red-team fixture paths resolve correctly from the new package root.
- Run a repository-level path audit with `rg` to find stale root-relative references to moved files.
- Run `git status --short --branch` and verify only intended moved/updated files are tracked, while `agent.md` remains untracked.

Live Volcengine calls remain outside default verification because the user will configure credentials later.

## Worktree And Subagent Split

This is a focused reorganization and can be handled as one module:

- Branch/worktree: `task/directory-layout`.
- File ownership:
  - Move ownership: `package.json`, `package-lock.json`, `src/**`, `tests/**`, `personas/**`, `redteam/**`, `tsconfig.json`, `vitest.config.ts`, `.prettierrc.json`, `.prettierignore`.
  - Root docs ownership: `README.md`, `docs/superpowers/specs/2026-04-28-directory-layout-design.md`, and the later implementation plan/summary docs.
  - Root ignore ownership: `.gitignore`.

Subagent usage:

- One worker can perform the move, path updates, and tests.
- One reviewer checks spec compliance and path-index coverage.
- One reviewer checks code quality and repository hygiene.

If subagent usage is unavailable, the same gates will be executed inline.

## Merge Conflict Risks

- `README.md` may conflict with future documentation edits.
- `.gitignore` and `.prettierignore` may conflict with unrelated cleanup work.
- File moves can look noisy in Git if content is edited heavily during the same commit.
- Existing task worktrees may retain the old root package layout and should not be merged after this reorganization without rebasing or recreating them.
- Untracked `agent.md` must remain untracked and must not be moved accidentally.

Mitigation:

- Keep code edits minimal during the move.
- Use `git mv` or equivalent tracked moves.
- Run stale-path searches after the move.
- Commit the reorganization separately from any functional changes.

## Phase Acceptance Criteria

The phase is acceptable when:

- The runnable package lives under `/Users/bytedance/Desktop/harness/harness`.
- Root `README.md` explains the new command location.
- `npm run check` passes from `/Users/bytedance/Desktop/harness/harness`.
- `npm run redteam` passes from `/Users/bytedance/Desktop/harness/harness`.
- The missing-env CLI smoke test confirms the CLI still starts and reports missing configuration cleanly.
- Stale path search finds no broken references to moved package files.
- `git status --short --branch` shows only the expected tracked changes and untracked `agent.md`.
- The change is committed on the implementation branch and merged to `main` only after review.
