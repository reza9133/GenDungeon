'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/useWallet';
import { WalletButton } from '@/components/WalletButton';
import * as gd from '@/lib/genDungeonClient';
import { QuestView, PlayerStatsView, QuestStatus } from '@/lib/types';

export default function GenDungeonPage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeQuest, setActiveQuest] = useState<QuestView | null>(null);
  const [stats, setStats] = useState<PlayerStatsView | null>(null);
  const [entryFee, setEntryFee] = useState<bigint>(1000000000000000000n);
  const [actionText, setActionText] = useState('');

  // Load configuration and player data when wallet connects
  const loadInitialData = async () => {
    try {
      const config = await gd.getConfig();
      setEntryFee(config.entryFee);
    } catch (error) {
      console.error("Error loading config:", error);
    }

    if (!address) return;
    try {
      const pStats = await gd.getPlayerStats(address);
      setStats(pStats);

      const questId = await gd.getPlayerActiveQuest(address);
      if (questId > 0) {
        const questData = await gd.getQuest(questId);
        setActiveQuest(questData);
      } else {
        setActiveQuest(null);
      }
    } catch (error) {
      console.error("Error loading player data:", error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [address]);

  // Game Actions
  const handleStartQuest = async () => {
    if (!address) return;
    setLoading(true);
    try {
      await gd.startQuest(address, entryFee);
      await loadInitialData();
    } catch (err: any) {
      alert("Error starting quest: " + err.message);
    }
    setLoading(false);
  };

  const handleSubmitAction = async () => {
    if (!address || !activeQuest) return;
    if (!actionText.trim()) return alert("Please write your action first!");

    setLoading(true);
    try {
      await gd.submitAction(address, activeQuest.questId, actionText);
      setActionText('');
      await loadInitialData();
    } catch (err: any) {
      alert("Error submitting action: " + err.message);
    }
    setLoading(false);
  };

  const handleResolveQuest = async () => {
    if (!address || !activeQuest) return;
    setLoading(true);
    try {
      await gd.resolveQuest(address, activeQuest.questId);
      await loadInitialData();
    } catch (err: any) {
      alert("Error resolving quest: " + err.message);
    }
    setLoading(false);
  };

  const handleClaimReward = async () => {
    if (!address || !activeQuest) return;
    setLoading(true);
    try {
      await gd.claimReward(address, activeQuest.questId);
      await loadInitialData();
    } catch (err: any) {
      alert("Error claiming reward: " + err.message);
    }
    setLoading(false);
  };

  const handleSurrender = async () => {
    if (!address) return;
    setLoading(true);
    try {
      await gd.surrenderQuest(address);
      await loadInitialData();
    } catch (err: any) {
      alert("Error surrendering: " + err.message);
    }
    setLoading(false);
  };

  const renderQuestArea = () => {
    if (!activeQuest) {
      return (
        <div className="panel-scroll text-center px-8 py-12">
          <p className="font-display text-xs tracking-[0.25em] text-[var(--ember)] mb-3">THE THRESHOLD AWAITS</p>
          <h2 className="font-display text-2xl md:text-3xl text-[var(--parchment)] mb-4">Enter the Dungeon</h2>
          <p className="text-[var(--parchment-dim)] mb-8 max-w-md mx-auto leading-relaxed">
            A new AI-generated scenario will be woven the moment you cross in. Entry costs{' '}
            <span className="text-[var(--ember-bright)] font-semibold">{Number(entryFee) / 1e18} GEN</span>.
          </p>
          <div className="inline-block torch-glow">
            <button
              onClick={handleStartQuest}
              disabled={loading}
              className="relative px-8 py-3 bg-gradient-to-b from-[var(--ember-bright)] to-[var(--ember)] text-[#241505] font-display font-semibold tracking-wide rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Summoning scenario…' : 'Start Quest'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="panel-scroll p-6 md:p-7">
        <div className="flex justify-between items-center mb-5 pb-4 divider-rune">
          <h3 className="font-display text-lg text-[var(--parchment)]">Quest No. {activeQuest.questId}</h3>
          <span className="px-3 py-1 bg-[var(--void)] rounded-sm text-[11px] tracking-wider text-[var(--parchment-dim)] border border-[var(--stone-border)]">
            {activeQuest.statusLabel}
          </span>
        </div>

        <div className="mb-7 pl-5 border-l-2 border-[var(--stone-border)]">
          <p className="text-[var(--parchment)] leading-relaxed italic">{activeQuest.scenario}</p>
        </div>

        {activeQuest.status === QuestStatus.ACTIVE && (
          <div className="space-y-4">
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="How do you overcome this obstacle? Describe your action…"
              className="w-full p-4 bg-[var(--void)] border border-[var(--stone-border)] rounded-sm text-[var(--parchment)] placeholder:text-[var(--parchment-dim)]/60 focus:outline-none focus:border-[var(--ember)] min-h-[120px] transition-colors"
            />
            <div className="flex justify-between items-center pt-1">
              <button
                onClick={handleSurrender}
                disabled={loading}
                className="text-[var(--blood)] hover:text-[#c65c57] transition-colors text-sm"
              >
                Surrender (forfeit fee)
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={loading || !actionText}
                className="px-6 py-2.5 bg-[var(--verdant)] hover:brightness-110 text-[#0c1a12] font-display font-semibold rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting…' : 'Submit Action'}
              </button>
            </div>
          </div>
        )}

        {activeQuest.status === QuestStatus.SUBMITTED && (
          <div className="text-center space-y-5">
            <div className="p-4 bg-[var(--void)] border border-[var(--stone-border)] rounded-sm text-left">
              <span className="text-[var(--parchment-dim)] text-xs tracking-wide">YOUR ACTION</span>
              <p className="text-[var(--parchment)] mt-2 leading-relaxed">{activeQuest.action}</p>
            </div>
            <button
              onClick={handleResolveQuest}
              disabled={loading}
              className="w-full px-6 py-3 bg-[var(--arcane)] hover:brightness-110 text-[#171233] font-display font-semibold rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'The validators are judging your fate…' : 'Resolve Quest'}
            </button>
          </div>
        )}

        {activeQuest.status === QuestStatus.SUCCESS && (
          <div className="space-y-4 text-center">
            <div className="p-5 bg-[var(--verdant)]/10 border border-[var(--verdant)]/40 rounded-sm">
              <h4 className="font-display text-[var(--verdant)] mb-2">
                Victory <span className="text-[var(--parchment-dim)] font-sans text-sm font-normal">— Creativity {activeQuest.creativityScore}</span>
              </h4>
              <p className="text-[var(--parchment-dim)] italic leading-relaxed">{activeQuest.narrativeOutcome}</p>
            </div>
            <div className="inline-block torch-glow w-full">
              <button
                onClick={handleClaimReward}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-b from-[var(--ember-bright)] to-[var(--ember)] text-[#241505] font-display font-semibold rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Claiming…' : `Claim Reward (${Number(activeQuest.reward) / 1e18} GEN)`}
              </button>
            </div>
          </div>
        )}

        {activeQuest.status === QuestStatus.FAILED && (
          <div className="space-y-4 text-center">
            <div className="p-5 bg-[var(--blood)]/10 border border-[var(--blood)]/40 rounded-sm">
              <h4 className="font-display text-[var(--blood)] mb-2">
                Defeat <span className="text-[var(--parchment-dim)] font-sans text-sm font-normal">— Creativity {activeQuest.creativityScore}</span>
              </h4>
              <p className="text-[var(--parchment-dim)] italic leading-relaxed">{activeQuest.narrativeOutcome}</p>
            </div>
            <button
              onClick={() => loadInitialData()}
              className="px-6 py-2.5 bg-[var(--stone-2)] hover:bg-[var(--stone-border)] border border-[var(--stone-border)] text-[var(--parchment)] font-display rounded-sm transition-colors"
            >
              Clear & Restart
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen text-[var(--parchment)] p-4 md:p-8 selection:bg-[var(--ember)]/30">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="panel-stone flex flex-col md:flex-row justify-between items-center gap-4 p-6 rounded-sm">
          <div className="flex items-center gap-3">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M12 2C10 5 8 6.5 8 10a4 4 0 0 0 8 0c0-3.5-2-5-4-8Z" fill="var(--ember)" opacity="0.85" />
              <path d="M12 6c-1 1.5-2 2.6-2 4.4a2 2 0 0 0 4 0C14 8.6 13 7.5 12 6Z" fill="var(--ember-bright)" />
              <rect x="10.6" y="14" width="2.8" height="8" rx="1" fill="var(--stone-border)" />
            </svg>
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--ember-bright)]">GenDungeon</h1>
              <p className="text-[var(--parchment-dim)] text-xs tracking-wide mt-0.5">AI-adjudicated RPG on GenLayer</p>
            </div>
          </div>
          <WalletButton />
        </header>

        {!address ? (
          <div className="panel-scroll text-center py-20 px-6">
            <p className="font-display text-lg text-[var(--parchment-dim)]">Connect your wallet to begin your adventure.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="panel-stone p-6 rounded-sm">
                <h3 className="font-display text-sm tracking-wide text-[var(--ember)] pb-3 mb-4 divider-rune">Adventurer Stats</h3>
                {stats ? (
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex justify-between items-baseline">
                      <span className="text-[var(--parchment-dim)]">Quests Started</span>
                      <span className="font-display font-semibold">{stats.questsStarted}</span>
                    </li>
                    <li className="flex justify-between items-baseline">
                      <span className="text-[var(--parchment-dim)]">Victories</span>
                      <span className="font-display font-semibold text-[var(--verdant)]">{stats.questsSucceeded}</span>
                    </li>
                    <li className="flex justify-between items-baseline">
                      <span className="text-[var(--parchment-dim)]">Defeats</span>
                      <span className="font-display font-semibold text-[var(--blood)]">{stats.questsFailed}</span>
                    </li>
                    <li className="flex justify-between items-baseline pt-3.5 mt-1 divider-rune">
                      <span className="text-[var(--parchment-dim)]">Total Earnings</span>
                      <span className="font-display font-semibold text-[var(--ember-bright)]">{Number(stats.totalRewardsEarned) / 1e18} GEN</span>
                    </li>
                  </ul>
                ) : (
                  <p className="text-[var(--parchment-dim)] text-sm animate-pulse">Loading stats…</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {renderQuestArea()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
