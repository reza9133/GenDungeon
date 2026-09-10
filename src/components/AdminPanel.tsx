import { useState } from "react";
import { weiToGen } from "../lib/format";
import type { ConfigData } from "../lib/contract";

interface AdminPanelProps {
  config: ConfigData | null;
  busy: boolean;
  onFundPool: (amountGen: string) => void;
  onUpdateParams: (entryFeeGen: string, minRewardGen: string, maxRewardGen: string) => void;
}

export default function AdminPanel({
  config,
  busy,
  onFundPool,
  onUpdateParams,
}: AdminPanelProps) {
  const [open, setOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [entryFee, setEntryFee] = useState(config ? weiToGen(config.entryFee) : "");
  const [minReward, setMinReward] = useState(config ? weiToGen(config.minReward) : "");
  const [maxReward, setMaxReward] = useState(config ? weiToGen(config.maxReward) : "");

  return (
    <section className="rounded-lg border border-candle-dim/40 bg-ink-soft/40 p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium text-candle-bright"
      >
        <span>Abbot's Hall (Owner Only)</span>
        <span>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-5 flex flex-col gap-6">
          <div>
            <label className="text-xs text-parchment-dim/70">
              Fund GEN into the Reward Pool
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="e.g. 25"
                className="w-full rounded-md border border-ink-rule bg-ink px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/30 focus:border-candle-dim focus:outline-none"
              />
              <button
                onClick={() => onFundPool(fundAmount)}
                disabled={busy || !fundAmount}
                className="whitespace-nowrap rounded-md bg-candle px-4 py-2 text-sm font-medium text-ink transition hover:bg-candle-bright disabled:opacity-50"
              >
                Fund
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-parchment-dim/70">
              Set Monastery Economy (Entry Fee / Min &amp; Max Reward)
            </label>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder="Entry fee"
                className="rounded-md border border-ink-rule bg-ink px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/30 focus:border-candle-dim focus:outline-none"
              />
              <input
                value={minReward}
                onChange={(e) => setMinReward(e.target.value)}
                placeholder="Min reward"
                className="rounded-md border border-ink-rule bg-ink px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/30 focus:border-candle-dim focus:outline-none"
              />
              <input
                value={maxReward}
                onChange={(e) => setMaxReward(e.target.value)}
                placeholder="Max reward"
                className="rounded-md border border-ink-rule bg-ink px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/30 focus:border-candle-dim focus:outline-none"
              />
            </div>
            <button
              onClick={() => onUpdateParams(entryFee, minReward, maxReward)}
              disabled={busy || !entryFee || !minReward || !maxReward}
              className="mt-2.5 rounded-md border border-candle-dim px-4 py-2 text-sm text-candle-bright transition hover:bg-candle/10 disabled:opacity-50"
            >
              Update Parameters
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
