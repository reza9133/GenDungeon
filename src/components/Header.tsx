import { shortAddress } from "../lib/format";
import { CONTRACT_ADDRESS } from "../lib/genlayerClient";
import type { WalletMode } from "../hooks/useWallet";

interface HeaderProps {
  mode: WalletMode;
  address: string | null;
  connecting: boolean;
  onConnectMetaMask: () => void;
  onConnectBurner: () => void;
  onDisconnect: () => void;
}

export default function Header({
  mode,
  address,
  connecting,
  onConnectMetaMask,
  onConnectBurner,
  onDisconnect,
}: HeaderProps) {
  return (
    <header className="border-b border-ink-rule/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl italic text-parchment">
            GenDungeon
          </span>
          <span className="hidden text-xs text-parchment-dim/60 sm:inline">
            A tale the on-chain scribes write
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://genlayer-explorer.vercel.app`}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-ink-rule px-3 py-1.5 text-xs text-parchment-dim/70 transition hover:border-candle-dim hover:text-candle-bright sm:inline"
            title={CONTRACT_ADDRESS}
          >
            Contract: {shortAddress(CONTRACT_ADDRESS)}
          </a>

          {mode === "none" && (
            <>
              <button
                onClick={onConnectMetaMask}
                disabled={connecting}
                className="rounded-full bg-candle px-4 py-2 text-sm font-medium text-ink transition hover:bg-candle-bright disabled:opacity-50"
              >
                Connect Wallet
              </button>
              <button
                onClick={onConnectBurner}
                disabled={connecting}
                className="rounded-full border border-ink-rule px-4 py-2 text-sm text-parchment-dim transition hover:border-candle-dim hover:text-candle-bright disabled:opacity-50"
              >
                Burner Account
              </button>
            </>
          )}

          {mode !== "none" && address && (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 rounded-full border border-ink-rule px-4 py-2 text-sm text-parchment-dim transition hover:border-seal hover:text-seal-bright"
              title="Disconnect"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  mode === "metamask" ? "bg-moss-bright" : "bg-candle-bright"
                }`}
              />
              {mode === "burner" ? "Burner" : "Wallet"} · {shortAddress(address)}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
