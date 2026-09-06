# 🕯️ GenDungeon

> *An AI Dungeon Master lives on-chain. It writes your obstacles. It judges your
> choices. It never runs the same story twice.*

GenDungeon is a "living manuscript" frontend for an **Intelligent Contract**
on GenLayer — a smart contract with a non-deterministic LLM at its core,
kept honest by validator consensus instead of a single trusted server.
No backend, no game master behind a curtain. Just the chain, a pool of GEN,
and a story that writes itself one block at a time.

**Contract:** `0x689d7959eaE2f0397cA7a4847eA6B0269408Db76` · Network: **GenLayer Studio**

---

## 📜 How a chapter unfolds

Every quest is a five-act play performed entirely by the contract:

| # | Method | Type | What happens |
|---|--------|------|---------------|
| 1 | `start_quest` | 💰 payable | You pay the entry fee → it drops into the reward pool → the AI scribes reach consensus on a brand-new obstacle, written just for you. |
| 2 | `submit_action` | ✍️ write | You describe, in your own words, how you attempt to overcome it. No multiple choice — pure freeform text. |
| 3 | `resolve_quest` | ⚖️ write | The validators independently re-judge your action for logic and creativity, then vote. Openly callable by anyone, so no quest is ever stuck waiting on a single actor. |
| 4 | `claim_reward` | 💸 write | Win, and you pull your reward out of the pool — via a Checks-Effects-Interactions withdrawal, so the payout can't be gamed mid-transaction. |
| 5 | `surrender_quest` | 🏳️ write | Lose your nerve, forfeit the entry fee, and open a fresh page. |

Every quest carries a status through its life: `ACTIVE → SUBMITTED → SUCCESS`
or `FAILED` → optionally `CLAIMED`. The frontend narrates each of these
transitions live via `TransactionOverlay`, so you watch consensus happen
instead of staring at a spinner.

## 🧠 Why this isn't just "a contract that calls an API"

The scenario text and the pass/fail verdict aren't fetched from some
off-chain oracle you have to trust — they're produced through GenLayer's
**Optimistic Democracy** consensus:

- A leader node proposes an LLM output (a scenario, or a verdict).
- One or more validator nodes **independently regenerate their own answer**
  from scratch — not just rubber-stamp the leader's formatting — and the
  network only finalizes state once they agree closely enough (exact match
  on success/failure, ±15 tolerance on the creativity score).
- Only after that non-deterministic consensus settles does any deterministic
  state mutation (pool balance, quest status, stats) actually happen.

That's the "living manuscript" conceit: no single party — not even the
contract deployer — unilaterally decides whether your witty escape plan
deserves the jackpot.

## 🚀 Run it

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually `http://localhost:5173`).

## 🔑 Connecting

Two ways into the monastery:

1. **Browser wallet (MetaMask or similar)** — click **Connect Wallet**. The
   app calls `client.connect("studionet")` to add/switch your wallet to the
   GenLayer Studio network. Recommended for real, persistent play.
2. **Burner account** — a throwaway private key generated and stashed in
   your browser's `localStorage` (never sent anywhere). Perfect for a quick
   test run, but fund it first from the 💧 faucet in the GenLayer Studio
   interface so it can cover the entry fee.

## ⚠️ A note on how contract data comes back over the wire

The contract's view methods (`get_config`, `get_quest`, `get_player_stats`, …)
return instances of `@allow_storage` dataclasses (`ConfigView`, `QuestView`,
etc.) — every custom-class-returning example in the official GenLayer docs
uses `@allow_storage`, but the *exact* calldata encoding for client languages
(JS/TS) isn't formally pinned down. So `src/lib/contract.ts` reads every
field defensively, trying several plausible key names (`snake_case` and
`camelCase`) via a `pick(...)` fallback chain rather than assuming one shape.

If something doesn't render correctly against the live contract:

1. Call the `get_*` method straight from the browser console with
   `client.readContract(...)` and inspect the raw response shape.
2. Line up the `pick(...)` and `normalize*` functions in
   `src/lib/contract.ts` with whatever key names actually came back.

## 🗂️ Structure

```
src/
  lib/
    genlayerClient.ts    Network connection (read-only, wallet, burner account)
    contract.ts          Typed contract read/write functions + defensive decoding
    format.ts            GEN <-> wei conversion and display helpers
  hooks/
    useWallet.ts         Wallet connection state
    useGameData.ts       Periodic polling of public/player data
  components/
    Header                Wallet controls, contract link
    ManuscriptCard         The central quest card — the whole game loop lives here
    LedgerRail              Pool stats + your lifetime stats
    QuestHistory / ActiveQuestsFeed   Your past chapters / everyone else's live battles
    TransactionOverlay      Live narration of each consensus step
    AdminPanel               Owner-only pool funding & parameter tuning
```

## ⛽ Gas cost / genlayer-js version

Tested against `genlayer-js@1.1.8` (latest stable at time of writing). If
you bump the SDK, re-check the signatures of `readContract` /
`writeContract` / `waitForTransactionReceipt` in particular — those are the
three calls this frontend leans on hardest.
