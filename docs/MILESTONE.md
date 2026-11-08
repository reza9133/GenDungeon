# Milestone: GenDungeon v2

Repository: https://github.com/reza9133/GenDungeon

## Text for the portal ("Changes & Improvements", 1000 characters at most)

```text
v2 rebuilds GenDungeon around a deterministic core. The LLM now reports only three rubric scores and a tamper flag; the contract derives the verdict, reward, renown and ranks itself, and validators accept judgments that agree on the verdict within +-15. Fixes the v1 empty-pool lock-out and the string "false" read as success; adds a books-balance invariant and solvency flag in get_treasury and a per-quest payout cap. Adds prompt-injection hardening (normalising filter, untrusted-data framing, second-model scenario audit), 3 difficulty tiers, renown/ranks/streaks/hall of fame, quest expiry, pause, two-step ownership, quote and dry-run views. Frontend rebuilt: GenLayer-mark logo, 7 pages, 3D hero, demo mode, axe-clean, lazy chunks. Verified by 276 contract tests, 14/14 mutants killed, fuzzed invariants, 82 TS tests and a live E2E suite that passed on GenLayer Studio (27 passed, 0 failed; contract 0xF7eb3Aa417c155814EB44247A1308EB23Fc02805).
```

## What changed, and where to see it

| Area | Change | Where |
|---|---|---|
| Contract functionality | Verdict derived by the contract from three scores; tiers, renown, ranks, streaks, hall of fame | `contracts/GenDungeon.py`, [CONTRACT_API.md](CONTRACT_API.md) |
| Security | Normalising injection filter, untrusted-data framing, second-model scenario audit, tamper flag | [SECURITY.md](SECURITY.md) |
| Architecture | Auditable reservations, books-balance invariant, O(limit) views, owner controls, pause, expiry | [ARCHITECTURE.md](ARCHITECTURE.md), [ECONOMY.md](ECONOMY.md) |
| Bug fix | v1 empty-pool lock-out | `test_victory_with_empty_pool_is_claimable_and_frees_the_player` |
| Frontend | Seven pages, logo from the GenLayer mark, 3D hero, demo mode | [UI.md](UI.md) |
| Quality | Contract tests, mutation testing, fuzzing, harness self-tests, live end-to-end suite | [TESTING.md](TESTING.md), [E2E.md](E2E.md) |

A side-by-side v1 and v2 table is in the README and in the app's Codex page.

## Deployment

The v2 contract is deployed on GenLayer Studio at `0xF7eb3Aa417c155814EB44247A1308EB23Fc02805`. The deployed source is byte-identical to
`contracts/GenDungeon.py` (SHA-256 `7f70148e775125691bd62d7f79c7151fe1db9fed4ed5d8075153b5ff8ef0c821`, recorded in
[reports/LATEST-live.md](../reports/LATEST-live.md)). The hosted app opens on it by default (`DEPLOYED_V2_ADDRESS`, no environment variable needed); `?demo=1` opens the simulation.

## Evidence

| Claim | How to check | Status |
|---|---|---|
| 276 contract test cases pass | `npm run test:contract` | Run during development, all passing |
| 14 of 14 mutants caught | `npm run mutation` | Run during development, all caught |
| 82 TypeScript tests pass | `npm test` | Re-run `npm run check` before submitting |
| Typecheck and production build are clean | `npm run check` | Run during development |
| No accessibility violations | `npm run ui:a11y` (needs a running preview) | 14 combinations, none |
| Bundle sizes in [UI.md](UI.md) | `npm run build`, `npm run ui:perf` | Measured |
| The end-to-end suite catches injected faults | `e2e/live/dry.test.ts` | 9 faults, all caught |
| **The contract behaves on GenLayer** | `npm run e2e:live` in a Codespace, then `npm run e2e:commit` | **Passed** on Studio on 2026-11-07: 27 passed, 0 failed, 1 skipped (`A12` needs `E2E_SLOW=1`), 3 observed. Report: [reports/LATEST-live.md](../reports/LATEST-live.md) |

## Before submitting

1. The live run is done: [reports/LATEST-live.md](../reports/LATEST-live.md) records the deployed address and every
   transaction.
2. Put `0xF7eb3Aa417c155814EB44247A1308EB23Fc02805` into the submission as the new deployment. The hosted app opens on it by
   default; set `VITE_CONTRACT_ADDRESS` only to point it at another deployment.
3. Run `npm run check` and `npm run test:contract` once more.
4. Host the app (`npm run build`, then serve `dist/`) and add the link, if you want traction evidence.

## Honest limits

- The live suite has run on GenLayer Studio and passed. Quest expiry (`A12`) was skipped because it needs a five-minute
  wait (`E2E_SLOW=1`). The two GitHub workflows were written without network access to GitHub and are not recorded as
  executed there.
- The deployed contract's owner is the throwaway `owner` account of that run. Keep its key (`.e2e/accounts.json`) or hand
  the contract over with `transfer_ownership`.
- Real judges are language models. The suite asserts the deterministic parts exactly and only records what the judges
  do.
- The marker filter is a list. Persuasion that avoids every listed phrase reaches the judge; the design limits what it
  can achieve ([SECURITY.md](SECURITY.md), residual risk).
