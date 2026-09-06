import { useCallback, useEffect, useRef, useState } from "react";
import { createReadOnlyClient } from "../lib/genlayerClient";
import {
  ActiveQuestItem,
  ConfigData,
  PlayerStatsData,
  QuestData,
  QuestHistoryItem,
  QuestStatus,
  getConfig,
  getOwner,
  getPlayerActiveQuest,
  getPlayerHistory,
  getPlayerStats,
  getQuest,
  listActiveQuests,
} from "../lib/contract";

interface GameData {
  config: ConfigData | null;
  owner: string | null;
  activeQuestId: number | null;
  activeQuest: QuestData | null;
  stats: PlayerStatsData | null;
  history: QuestHistoryItem[];
  globalActiveQuests: ActiveQuestItem[];
  loading: boolean;
  error: string | null;
}

const EMPTY: GameData = {
  config: null,
  owner: null,
  activeQuestId: null,
  activeQuest: null,
  stats: null,
  history: [],
  globalActiveQuests: [],
  loading: true,
  error: null,
};

/**
 * Polls every public/player-scoped view method the UI needs. Reads are
 * cheap and free, so a short interval keeps the manuscript feeling "alive"
 * without requiring the player to manually refresh after a transaction
 * lands.
 */
export function useGameData(playerAddress: string | null, refreshKey: number) {
  const [data, setData] = useState<GameData>(EMPTY);
  const readClient = useRef(createReadOnlyClient());

  const load = useCallback(async () => {
    const client = readClient.current;
    try {
      const [config, owner, globalActiveQuests] = await Promise.all([
        getConfig(client),
        getOwner(client),
        listActiveQuests(client, 12),
      ]);

      let activeQuestId: number | null = null;
      let activeQuest: QuestData | null = null;
      let stats: PlayerStatsData | null = null;
      let history: QuestHistoryItem[] = [];

      if (playerAddress) {
        const [questIdRaw, playerStats, playerHistory] = await Promise.all([
          getPlayerActiveQuest(client, playerAddress),
          getPlayerStats(client, playerAddress),
          getPlayerHistory(client, playerAddress, 20),
        ]);
        stats = playerStats;
        history = playerHistory;
        if (questIdRaw && questIdRaw > 0) {
          activeQuestId = questIdRaw;
          activeQuest = await getQuest(client, questIdRaw);
          // A quest can still be flagged "active" for the player slot even
          // after it resolves to CLAIMED, in the brief window before the
          // next read - treat CLAIMED as "no current chapter" for display.
          if (activeQuest.status === QuestStatus.CLAIMED) {
            activeQuestId = null;
            activeQuest = null;
          }
        }
      }

      setData({
        config,
        owner,
        activeQuestId,
        activeQuest,
        stats,
        history,
        globalActiveQuests,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err?.message ?? "Failed to read data from the contract.",
      }));
    }
  }, [playerAddress]);

  useEffect(() => {
    setData((prev) => ({ ...prev, loading: true }));
    load();
    // 12s rather than a tighter interval - GenLayer Studio's public RPC
    // rate-limits aggressive polling (observed as HTTP 429s), and reads
    // don't need to be that fresh to feel responsive.
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, [load, refreshKey]);

  return { ...data, reload: load };
}
