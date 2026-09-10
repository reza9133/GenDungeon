import { useState } from "react";
import { TransactionStatus } from "genlayer-js/types";
import { useWallet } from "./hooks/useWallet";
import { useGameData } from "./hooks/useGameData";
import { genToWei } from "./lib/format";
import {
  claimReward,
  fundPool,
  resolveQuest,
  setFeeAndRewards,
  startQuest,
  submitAction,
  surrenderQuest,
} from "./lib/contract";
import Header from "./components/Header";
import ManuscriptCard from "./components/ManuscriptCard";
import LedgerRail from "./components/LedgerRail";
import QuestHistory from "./components/QuestHistory";
import ActiveQuestsFeed from "./components/ActiveQuestsFeed";
import TransactionOverlay from "./components/TransactionOverlay";
import AdminPanel from "./components/AdminPanel";

interface OverlayState {
  title: string;
  status: TransactionStatus | null;
  error: string | null;
}

export default function App() {
  const wallet = useWallet();
  const [refreshKey, setRefreshKey] = useState(0);
  const game = useGameData(wallet.address, refreshKey);
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [busy, setBusy] = useState(false);

  const isOwner =
    !!wallet.address &&
    !!game.owner &&
    wallet.address.toLowerCase() === game.owner.toLowerCase();

  async function runAction<T>(
    title: string,
    action: (onStatus: (s: TransactionStatus) => void) => Promise<T>
  ) {
    if (!wallet.client) return;
    setBusy(true);
    setOverlay({ title, status: null, error: null });
    try {
      await action((status) => setOverlay((o) => (o ? { ...o, status } : o)));
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setOverlay((o) =>
        o ? { ...o, error: err?.message ?? "This action failed." } : o
      );
    } finally {
      setBusy(false);
    }
  }

  const handleStartQuest = () => {
    if (!wallet.client || !game.config) return;
    runAction("Opening a new chapter", (onStatus) =>
      startQuest(wallet.client!, game.config!.entryFee, onStatus)
    );
  };

  const handleSubmitAction = (action: string) => {
    if (!wallet.client || !game.activeQuestId || action.trim().length === 0) return;
    runAction("Submitting your action", (onStatus) =>
      submitAction(wallet.client!, game.activeQuestId!, action.trim(), onStatus)
    );
  };

  const handleResolve = () => {
    if (!wallet.client || !game.activeQuestId) return;
    runAction("Scribe judgment", (onStatus) =>
      resolveQuest(wallet.client!, game.activeQuestId!, onStatus)
    );
  };

  const handleClaim = () => {
    if (!wallet.client || !game.activeQuestId) return;
    runAction("Claiming reward", (onStatus) =>
      claimReward(wallet.client!, game.activeQuestId!, onStatus)
    );
  };

  const handleSurrender = () => {
    if (!wallet.client) return;
    runAction("Fleeing the quest", (onStatus) => surrenderQuest(wallet.client!, onStatus));
  };

  const handleFundPool = (amountGen: string) => {
    if (!wallet.client) return;
    runAction("Funding the pool", (onStatus) =>
      fundPool(wallet.client!, genToWei(amountGen), onStatus)
    );
  };

  const handleUpdateParams = (entryFeeGen: string, minRewardGen: string, maxRewardGen: string) => {
    if (!wallet.client) return;
    runAction("Updating parameters", (onStatus) =>
      setFeeAndRewards(
        wallet.client!,
        genToWei(entryFeeGen),
        genToWei(minRewardGen),
        genToWei(maxRewardGen),
        onStatus
      )
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <Header
        mode={wallet.mode}
        address={wallet.address}
        connecting={wallet.connecting}
        onConnectMetaMask={wallet.connectMetaMask}
        onConnectBurner={wallet.connectBurner}
        onDisconnect={wallet.disconnect}
      />

      {wallet.error && (
        <div className="mx-auto mt-4 max-w-6xl px-5 sm:px-8">
          <p className="rounded-md border border-seal/40 bg-seal/10 px-4 py-2.5 text-sm text-seal-bright">
            {wallet.error}
          </p>
        </div>
      )}

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-5 pt-10 sm:px-8 lg:flex-row-reverse">
        <LedgerRail config={game.config} stats={game.stats} connected={!!wallet.address} />

        <div className="flex-1 space-y-10">
          <ManuscriptCard
            connected={!!wallet.address}
            config={game.config}
            quest={game.activeQuest}
            busy={busy}
            onStartQuest={handleStartQuest}
            onSubmitAction={handleSubmitAction}
            onResolve={handleResolve}
            onClaim={handleClaim}
            onSurrender={handleSurrender}
          />

          <section>
            <h2 className="chapter-mark mb-4">Others' Battlefield</h2>
            <ActiveQuestsFeed items={game.globalActiveQuests} />
          </section>

          {!!wallet.address && (
            <section>
              <h2 className="chapter-mark mb-4">Chronicle of Past Chapters</h2>
              <QuestHistory items={game.history} />
            </section>
          )}

          {isOwner && (
            <AdminPanel
              config={game.config}
              busy={busy}
              onFundPool={handleFundPool}
              onUpdateParams={handleUpdateParams}
            />
          )}
        </div>
      </main>

      {overlay && (
        <TransactionOverlay
          title={overlay.title}
          status={overlay.status}
          error={overlay.error}
          onDismiss={() => setOverlay(null)}
        />
      )}
    </div>
  );
}
