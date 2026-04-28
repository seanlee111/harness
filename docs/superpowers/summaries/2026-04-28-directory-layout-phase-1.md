# Directory Layout Reorganization Phase 1 Summary

Date: 2026-04-28

## Scope

Moved the runnable TypeScript package into `harness/` and kept repository-level docs at the root.

## Changes

- Moved package metadata, source, tests, persona fixtures, red-team fixtures, TypeScript config, Vitest config, and Prettier config into `harness/`.
- Updated root `README.md` to document `cd harness` before npm commands.
- Added path-index regression tests for the nested package boundary.
- Added fixture loading tests for package-local persona and red-team defaults.
- Kept `agent.md` untracked and unmoved.

## Verification

- `cd harness && npm run check`: passed with 12 test files and 30 tests.
- `cd harness && npm run redteam`: passed with dry-run guidance output.
- `cd harness && env -u VOLCENGINE_API_KEY -u VOLCENGINE_BASE_URL -u VOLCENGINE_MODEL npm run cli`: exited 1 with missing `VOLCENGINE_API_KEY` and no stack trace.
- Repository root path audit: passed; moved package files are absent from root and present under `harness/`.
- Ignore audit: passed for `harness/node_modules`, `harness/transcripts`, and `harness/reports`.

## Reviews

- Spec compliance review: no P0/P1/P2/P3 findings.
- Code quality review: no P0/P1/P2 findings.
- P3 root `node_modules/` hygiene finding was fixed by removing the stale ignored root dependency directory.
- P3 commit identity finding remains an existing repository configuration issue: recent history uses `Your Name <you@gmail.com>`.

## Acceptance Notes

- Runtime package files live under `harness/`.
- Root `README.md` documents the nested package command boundary.
- Default persona and red-team fixture paths are covered by tests.
- `agent.md` remains untracked and unmoved.
- Live Volcengine verification remains pending user environment configuration.
