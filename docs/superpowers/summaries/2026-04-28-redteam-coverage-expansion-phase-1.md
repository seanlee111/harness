# Red-Team Coverage Expansion Phase 1 Summary

Date: 2026-04-28

## Scope

Expanded the default red-team fixture and added coverage tests for category breadth, shape, uniqueness, normalized obfuscation, homophone variants, and benign controls.

## Changes

- Expanded `harness/redteam/default.json` to 28 cases.
- Added `harness/tests/redteam/defaultCoverage.test.ts`.
- Updated `harness/tests/redteam/loadCases.test.ts` to pin the expanded fixture order.
- Kept red-team assertions as test oracles instead of product blocking rules.
- Kept persona forbidden-term lists unchanged for this phase.

## Coverage

- Prompt injection: 3 cases.
- System extraction: 3 cases.
- Authority spoofing: 2 cases.
- Persona override: 2 cases.
- Style coercion: 2 cases.
- Encoding and obfuscation: 3 cases.
- Homophone attacks: 3 cases.
- Multi-turn manipulation: 3 cases.
- Benign controls: 3 cases.

## Verification

- `cd harness && npm test -- tests/redteam/defaultCoverage.test.ts`: failed before fixture expansion as expected.
- `cd harness && npm test -- tests/redteam/loadCases.test.ts tests/redteam/defaultCoverage.test.ts`: passed after fixture expansion.
- `cd harness && npm run check`: passed with 15 test files and 39 tests.
- `cd harness && npm run redteam`: passed with dry-run guidance output.
- `cd harness && npm run redteam:live`: skipped because Volcengine environment variables were not present in the current shell.

## Acceptance Notes

- `harness/redteam/default.json` contains at least 24 cases.
- Required attack-family prefixes are covered.
- Benign controls are present for measure-word usage, biology chat, and game chat.
- No persona forbidden-term blacklist was added to satisfy these cases.
- User-local files remain uncommitted.
