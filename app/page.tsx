'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/useWallet';
import { WalletButton } from '@/components/WalletButton'; // Adjust the import path if needed
import * as gd from '@/lib/genDungeonClient';
import { QuestView, PlayerStatsView } from '@/lib/types';

export default function GenDungeonPage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeQuest, setActiveQuest] = useState<QuestView | null>(null);
  const [stats, setStats] = useState<PlayerStatsView | null>(null);
  const [actionText, setActionText] = useState('');

  // Load player data when wallet connects
  const loadPlayerData = async () => {
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
    loadPlayerData();
  }, [address]);

  // --------------------------------------------------------
  // Game Actions
  // --------------------------------------------------------
  const handleStartQuest = async () => {
    if (!address) return;
    setLoading(true);
    try {
      // Entry fee: 1 GEN (18 decimals)
      const entryFee = 1000000000000000000n; 
      await gd.startQuest(address, entryFee);
      await loadPlayerData();
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
      await loadPlayerData();
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
      await loadPlayerData();
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
      await loadPlayerData();
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
      await loadPlayerData();
    } catch (err: any) {
      alert("Error surrendering: " + err.message);
    }
    setLoading(false);
  };

  // --------------------------------------------------------
  // Render Quest Area
  // --------------------------------------------------------
  const renderQuestArea = () => {
    if (!activeQuest) {
      return (
        <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-xl">
          <h2 className="text-2xl text-amber-500 font-bold mb-4">Enter the Dungeon</h2>
          <p className="text-slate-300 mb-6">Ready to face a new AI-generated challenge? (Entry Fee: 1 GEN)</p>
          <button 
            onClick={handleStartQuest} disabled={loading}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Summoning scenario..." : "Start Quest"}
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 bg-slate-800/80 border border-amber-900/50 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
          <h3 className="text-xl text-amber-500 font-bold">Quest #{activeQuest.questId}</h3>
          <span className="px-3 py-1 bg-slate-900 rounded-full text-xs text-slate-300 border border-slate-700 uppercase">
            Status: {activeQuest.statusLabel}
          </span>
        </div>

        <div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
          <p className="text-slate-200 leading-relaxed italic">"{activeQuest.scenario}"</p>
        </div>

        {/* Status 0: Active / Awaiting Action */}
        {activeQuest.status === 0 && (
          <div className="space-y-4">
            <textarea 
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="How do you overcome this obstacle? (Describe your action)..."
              className="w-full p-4 bg-slate-900 border border-amber-700/50 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 min-h-[120px]"
            />
            <div className="flex justify-between items-center">
              <button onClick={handleSurrender} disabled={loading} className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm">
                Surrender (Forfeit Fee)
              </button>
              <button onClick={handleSubmitAction} disabled={loading || !actionText} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                {loading ? "Submitting..." : "Submit Action"}
              </button>
            </div>
          </div>
        )}

        {/* Status 1: Submitted / Awaiting Resolution */}
        {activeQuest.status === 1 && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-left">
              <span className="text-slate-400 text-sm">Your Action:</span>
              <p className="text-slate-200 mt-1">{activeQuest.action}</p>
            </div>
            <button onClick={handleResolveQuest} disabled={loading} className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
              {loading ? "AI is judging your fate..." : "Resolve Quest"}
            </button>
          </div>
        )}

        {/* Status 2: Success! */}
        {activeQuest.status === 2 && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
              <h4 className="text-emerald-400 font-bold mb-2">Victory! (Creativity Score: {activeQuest.creativityScore})</h4>
              <p className="text-slate-300 italic">{activeQuest.narrativeOutcome}</p>
            </div>
            <button onClick={handleClaimReward} disabled={loading} className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50">
              {loading ? "Claiming..." : `Claim Reward (${Number(activeQuest.reward) / 1e18} GEN)`}
            </button>
          </div>
        )}

        {/* Status 3: Failed */}
        {activeQuest.status === 3 && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
              <h4 className="text-red-400 font-bold mb-2">Defeat! (Creativity Score: {activeQuest.creativityScore})</h4>
              <p className="text-slate-300 italic">{activeQuest.narrativeOutcome}</p>
            </div>
            <button onClick={() => loadPlayerData()} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
              Clear & Restart
            </button>
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------------------------
  // Main UI
  // --------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
              GenDungeon
            </h1>
            <p className="text-slate-400 text-sm mt-1">AI-Powered RPG on GenLayer</p>
          </div>
          <WalletButton />
        </header>

        {/* Main Content (Requires Wallet Connection) */}
        {!address ? (
          <div className="text-center py-20">
            <h2 className="text-2xl text-slate-500">Connect your wallet to begin your adventure.</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Player Stats */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2 mb-4">Adventurer Stats</h3>
                {stats ? (
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between"><span className="text-slate-400">Quests Started:</span> <span className="font-bold">{stats.questsStarted}</span></li>
                    <li className="flex justify-between"><span className="text-slate-400">Victories:</span> <span className="text-emerald-400 font-bold">{stats.questsSucceeded}</span></li>
                    <li className="flex justify-between"><span className="text-slate-400">Defeats:</span> <span className="text-red-400 font-bold">{stats.questsFailed}</span></li>
                    <li className="flex justify-between border-t border-slate-800 pt-3 mt-3">
                      <span className="text-slate-400">Total Earnings:</span> 
                      <span className="text-amber-400 font-bold">{Number(stats.totalRewardsEarned) / 1e18} GEN</span>
                    </li>
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm animate-pulse">Loading stats...</p>
                )}
              </div>
            </div>

            {/* Right Column: Dungeon Interface */}
            <div className="lg:col-span-2">
              {renderQuestArea()}
            </div>
            
          </div>
        )}
      </div>
    </main>
  );
}
