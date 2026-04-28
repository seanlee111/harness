# Desktop Worktree Containment Spec

Date: 2026-04-28

Status: Draft, awaiting user review.

## Context

After the directory layout reorganization, the repository root is `/Users/bytedance/Desktop/harness` and the runnable package is `/Users/bytedance/Desktop/harness/harness`.

The user wants the Desktop root to have no project-related functional directories except `/Users/bytedance/Desktop/harness`. This scope applies only to directories created for this project, not to unrelated Desktop projects such as `AIGC_workflow`, `EmotiveAgent`, `Stanford`, `api`, or `superpowers`.

Current project-related directories outside the repository root are Git worktrees:

- `/Users/bytedance/Desktop/harness-foundation`
- `/Users/bytedance/Desktop/harness-persona-harness`
- `/Users/bytedance/Desktop/harness-engine-model`
- `/Users/bytedance/Desktop/harness-cli-transcript`
- `/Users/bytedance/Desktop/harness-redteam-evaluator`
- `/Users/bytedance/Desktop/harness-integration`
- `/Users/bytedance/Desktop/harness-directory-layout`

These are temporary task worktrees from completed phases. They should not be moved with ordinary filesystem operations because Git tracks worktree administrative metadata.

## Goals

- Ensure no project-related `harness-*` functional directories remain directly under `/Users/bytedance/Desktop`.
- Keep `/Users/bytedance/Desktop/harness` as the only Desktop-level directory for this project.
- Remove completed task worktrees using Git-aware commands.
- Establish `/Users/bytedance/Desktop/harness/.worktrees/` as the future location for any project worktrees.
- Add ignore coverage so `.worktrees/` is never tracked by Git.
- Preserve committed project code, docs, and history.
- Keep the runnable package under `/Users/bytedance/Desktop/harness/harness`.
- Preserve local user notes such as `agent.md`.

## Non-Goals

- Do not move, delete, rename, or inspect unrelated Desktop directories.
- Do not change agent runtime behavior, model behavior, CLI behavior, persona config, red-team behavior, or package scripts.
- Do not delete Git branches unless explicitly requested.
- Do not push to GitHub as part of this cleanup unless the user asks after phase acceptance.
- Do not add `agent.md` to Git.

## Selected Approach

Use Git worktree cleanup, not filesystem moves:

1. Verify every `harness-*` Desktop directory is registered as a Git worktree for this repository.
2. Verify each worktree is clean or only contains ignored dependency/cache output.
3. Run `npm run check` in any worktree whose branch has unmerged or uncertain state before removal.
4. Remove completed task worktrees with `git worktree remove`.
5. Run `git worktree prune` to clean stale worktree metadata.
6. Add `.worktrees/` to the repository root `.gitignore`.
7. Create the internal directory `/Users/bytedance/Desktop/harness/.worktrees/` only as an ignored container for future worktrees if needed.
8. Verify `/Users/bytedance/Desktop` no longer contains directories matching `/Users/bytedance/Desktop/harness-*`.

This keeps Desktop tidy while preserving the main repository and any branch refs.

## Module Boundaries

### Desktop Root

Owns:

- User-level project placement.
- The single project directory `/Users/bytedance/Desktop/harness`.

Must not:

- Contain project task worktrees such as `harness-foundation` or `harness-directory-layout`.
- Be cleaned broadly beyond the explicit `harness-*` project worktree set.

### Repository Root

Owns:

- Git repository metadata.
- `.gitignore`.
- `docs/superpowers/**`.
- Future worktree container `.worktrees/`.
- Local untracked user notes such as `agent.md`.

Must not:

- Track `.worktrees/`.
- Track `agent.md`.
- Contain active runnable package files outside `harness/`.

### Package Root

Owns:

- Runtime package under `/Users/bytedance/Desktop/harness/harness`.
- `npm run check`, `npm run redteam`, and CLI smoke verification.

Must not:

- Depend on deleted task worktrees.
- Read from Desktop-level `harness-*` directories.

## Interface Contracts

### Worktree Location Contract

Future project worktrees must be created under:

```text
/Users/bytedance/Desktop/harness/.worktrees/<branch-or-task-name>
```

They must not be created as Desktop siblings named `/Users/bytedance/Desktop/harness-*`.

### Cleanup Contract

Task worktrees are removed only through Git-aware commands:

```sh
git worktree remove <path>
git worktree prune
```

Ordinary `rm -rf` is allowed only for ignored cache/dependency directories inside a worktree after verifying they are not tracked, or for an already-unregistered stale path after explicit audit.

### Verification Contract

The cleanup is complete only if:

```sh
find /Users/bytedance/Desktop -maxdepth 1 -mindepth 1 -type d -name 'harness-*' -print
```

prints nothing, and:

```sh
git worktree list
```

shows `/Users/bytedance/Desktop/harness` plus no Desktop-level `harness-*` worktrees.

## Test Strategy

This is mostly workspace hygiene, so verification is command-driven:

- Run `git worktree list --porcelain` before cleanup and record the `harness-*` worktrees.
- Run `git status --short --branch` inside each registered task worktree before removal.
- For any worktree with tracked changes, stop and ask the user before removal.
- For worktrees that are clean except ignored `node_modules`, allow removal with Git-aware commands.
- Run `cd /Users/bytedance/Desktop/harness/harness && npm run check` after cleanup.
- Run `cd /Users/bytedance/Desktop/harness/harness && npm run redteam` after cleanup.
- Run `git check-ignore .worktrees/example` from repository root and expect it to print `.worktrees/example`.
- Run the Desktop sibling directory audit and require no `harness-*` directories.
- Run `git status --short --branch` from repository root and verify only expected tracked docs/ignore changes plus allowed local untracked notes remain.

## Worktree And Subagent Split

This is one cleanup module:

- Branch/worktree: no new Desktop sibling worktree should be created for this cleanup.
- Execution location: the main repository `/Users/bytedance/Desktop/harness`.
- File ownership: `.gitignore`, `docs/superpowers/specs/2026-04-28-desktop-worktree-containment-design.md`, later implementation plan and summary docs.
- Workspace ownership: remove only the seven listed `harness-*` task worktree directories.

Subagent usage:

- A reviewer subagent can inspect the cleanup plan and post-cleanup state.
- Implementation should be inline because the task removes worktrees and should be coordinated from the main repository.

## Merge Conflict Risks

- `.gitignore` may conflict with future ignore-rule edits.
- Worktree removal can fail if a worktree contains tracked changes or is locked.
- Removing a worktree that still contains useful uncommitted work would lose data, so tracked status must be checked first.
- Creating a new worktree for this cleanup would violate the user's Desktop-level containment goal.

Mitigation:

- Do not create another Desktop sibling worktree for this cleanup.
- Check each target worktree status before removal.
- Stop on any tracked change.
- Preserve branches; only remove worktree directories.
- Commit only documentation and ignore-rule changes.

## Phase Acceptance Criteria

The phase is acceptable when:

- `/Users/bytedance/Desktop` contains no directories matching `harness-*`.
- `git worktree list` no longer lists Desktop sibling `harness-*` worktrees.
- `/Users/bytedance/Desktop/harness` remains the project root.
- `/Users/bytedance/Desktop/harness/harness` remains the runnable package root.
- `.worktrees/` is ignored by Git and can be used for future project worktrees.
- `cd /Users/bytedance/Desktop/harness/harness && npm run check` passes.
- `cd /Users/bytedance/Desktop/harness/harness && npm run redteam` passes.
- No unrelated Desktop directories are changed.
- `agent.md` remains untracked and unmoved.
