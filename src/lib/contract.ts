import { TransactionStatus } from "genlayer-js/types";
import type { TransactionHash } from "genlayer-js/types";
import { CONTRACT_ADDRESS, type AppGenLayerClient } from "./genlayerClient";
import { toBigInt, toNumber, toText } from "./format";

/** Quest lifecycle, mirroring the STATUS_* constants in the contract. */
export const QuestStatus = {
  ACTIVE: 0,
  SUBMITTED: 1,
  SUCCESS: 2,
  FAILED: 3,
  CLAIMED: 4,
} as const;

export const STATUS_LABEL_EN: Record<number, string> = {
  0: "Awaiting Action",
  1: "Under Scribe Review",
  2: "Succeeded",
  3: "Failed",
  4: "Reward Claimed",
};

export interface ConfigData {
  entryFee: bigint;
  minReward: bigint;
  maxReward: bigint;
  rewardPool: bigint;
  totalQuestsCreated: number;
}

export interface QuestData {
  questId: number;
  player: string;
  scenario: string;
  action: string;
  status: number;
  statusLabel: string;
  creativityScore: number;
  reward: bigint;
  narrativeOutcome: string;
}

export interface PlayerStatsData {
  questsStarted: number;
  questsSucceeded: number;
  questsFailed: number;
  totalRewardsEarned: bigint;
}

export interface QuestHistoryItem {
  questId: number;
  status: number;
  statusLabel: string;
  creativityScore: number;
  reward: bigint;
}

export interface ActiveQuestItem {
  questId: number;
  player: string;
  scenario: string;
  status: number;
  statusLabel: string;
}

/**
 * The deployed contract's view methods return `@allow_storage` dataclasses
 * (ConfigView / QuestView / ...). We read every field defensively by name
 * with a `pick` fallback chain, since the exact calldata-encoded key casing
 * for custom dataclass returns isn't pinned down in the public GenLayer
 * docs at the time of writing. If the live contract's shape differs from
 * what's expected here, `raw` is preserved on read errors so it can be
 * inspected via the "Debug" panel in the UI instead of failing silently.
 */
function pick(obj: any, ...keys: string[]): unknown {
  if (obj === null || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return undefined;
}

function normalizeConfig(raw: any): ConfigData {
  return {
    entryFee: toBigInt(pick(raw, "entry_fee", "entryFee")),
    minReward: toBigInt(pick(raw, "min_reward", "minReward")),
    maxReward: toBigInt(pick(raw, "max_reward", "maxReward")),
    rewardPool: toBigInt(pick(raw, "reward_pool", "rewardPool")),
    totalQuestsCreated: toNumber(
      pick(raw, "total_quests_created", "totalQuestsCreated")
    ),
  };
}

function normalizeQuest(raw: any): QuestData {
  const status = toNumber(pick(raw, "status"));
  return {
    questId: toNumber(pick(raw, "quest_id", "questId")),
    player: toText(pick(raw, "player")),
    scenario: toText(pick(raw, "scenario")),
    action: toText(pick(raw, "action")),
    status,
    statusLabel: toText(
      pick(raw, "status_label", "statusLabel"),
      STATUS_LABEL_EN[status] ?? "Unknown"
    ),
    creativityScore: toNumber(pick(raw, "creativity_score", "creativityScore")),
    reward: toBigInt(pick(raw, "reward")),
    narrativeOutcome: toText(pick(raw, "narrative_outcome", "narrativeOutcome")),
  };
}

function normalizeStats(raw: any): PlayerStatsData {
  return {
    questsStarted: toNumber(pick(raw, "quests_started", "questsStarted")),
    questsSucceeded: toNumber(pick(raw, "quests_succeeded", "questsSucceeded")),
    questsFailed: toNumber(pick(raw, "quests_failed", "questsFailed")),
    totalRewardsEarned: toBigInt(
      pick(raw, "total_rewards_earned", "totalRewardsEarned")
    ),
  };
}

function normalizeHistoryItem(raw: any): QuestHistoryItem {
  const status = toNumber(pick(raw, "status"));
  return {
    questId: toNumber(pick(raw, "quest_id", "questId")),
    status,
    statusLabel: toText(
      pick(raw, "status_label", "statusLabel"),
      STATUS_LABEL_EN[status] ?? "Unknown"
    ),
    creativityScore: toNumber(pick(raw, "creativity_score", "creativityScore")),
    reward: toBigInt(pick(raw, "reward")),
  };
}

function normalizeActiveItem(raw: any): ActiveQuestItem {
  const status = toNumber(pick(raw, "status"));
  return {
    questId: toNumber(pick(raw, "quest_id", "questId")),
    player: toText(pick(raw, "player")),
    scenario: toText(pick(raw, "scenario")),
    status,
    statusLabel: toText(
      pick(raw, "status_label", "statusLabel"),
      STATUS_LABEL_EN[status] ?? "Unknown"
    ),
  };
}

// ---------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------

export async function getOwner(client: AppGenLayerClient): Promise<string> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_owner",
    args: [],
  });
  return toText(result);
}

export async function getConfig(client: AppGenLayerClient): Promise<ConfigData> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_config",
    args: [],
  });
  return normalizeConfig(result);
}

export async function getPlayerActiveQuest(
  client: AppGenLayerClient,
  player: string
): Promise<number> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_player_active_quest",
    args: [player],
  });
  return toNumber(result);
}

export async function getQuest(
  client: AppGenLayerClient,
  questId: number
): Promise<QuestData> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_quest",
    args: [questId],
  });
  return normalizeQuest(result);
}

export async function getPlayerStats(
  client: AppGenLayerClient,
  player: string
): Promise<PlayerStatsData> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_player_stats",
    args: [player],
  });
  return normalizeStats(result);
}

export async function getPlayerHistory(
  client: AppGenLayerClient,
  player: string,
  limit = 20
): Promise<QuestHistoryItem[]> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_player_history",
    args: [player, limit],
  });
  return Array.isArray(result) ? result.map(normalizeHistoryItem) : [];
}

export async function listActiveQuests(
  client: AppGenLayerClient,
  limit = 12
): Promise<ActiveQuestItem[]> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "list_active_quests",
    args: [limit],
  });
  return Array.isArray(result) ? result.map(normalizeActiveItem) : [];
}

// ---------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------

async function writeAndWait(
  client: AppGenLayerClient,
  functionName: string,
  args: unknown[],
  value: bigint,
  onStatus?: (status: TransactionStatus) => void
) {
  const hash = (await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: args as any[],
    value,
  })) as TransactionHash;

  // Narrate the consensus pipeline while we wait, rather than only
  // blocking silently until ACCEPTED.
  if (onStatus) {
    void pollStatus(client, hash, onStatus);
  }

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  onStatus?.(TransactionStatus.ACCEPTED);
  return { hash, receipt };
}

async function pollStatus(
  client: AppGenLayerClient,
  hash: TransactionHash,
  onStatus: (status: TransactionStatus) => void
) {
  const terminal = new Set([
    TransactionStatus.ACCEPTED,
    TransactionStatus.FINALIZED,
    TransactionStatus.UNDETERMINED,
    TransactionStatus.CANCELED,
    TransactionStatus.LEADER_TIMEOUT,
    TransactionStatus.VALIDATORS_TIMEOUT,
  ]);
  for (let i = 0; i < 60; i++) {
    try {
      const tx = await client.getTransaction({ hash });
      const status = (tx.statusName ?? tx.status) as TransactionStatus | undefined;
      if (status) {
        onStatus(status);
        if (terminal.has(status)) return;
      }
    } catch {
      // Transaction may not be indexed yet on the very first poll - ignore
      // and retry rather than surfacing a false error to the narrator.
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

export async function startQuest(
  client: AppGenLayerClient,
  entryFeeWei: bigint,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(client, "start_quest", [], entryFeeWei, onStatus);
}

export async function submitAction(
  client: AppGenLayerClient,
  questId: number,
  action: string,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(client, "submit_action", [questId, action], 0n, onStatus);
}

export async function resolveQuest(
  client: AppGenLayerClient,
  questId: number,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(client, "resolve_quest", [questId], 0n, onStatus);
}

export async function claimReward(
  client: AppGenLayerClient,
  questId: number,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(client, "claim_reward", [questId], 0n, onStatus);
}

export async function surrenderQuest(
  client: AppGenLayerClient,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(client, "surrender_quest", [], 0n, onStatus);
}

export async function fundPool(
  client: AppGenLayerClient,
  amountWei: bigint,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(client, "fund_pool", [], amountWei, onStatus);
}

export async function setFeeAndRewards(
  client: AppGenLayerClient,
  entryFeeWei: bigint,
  minRewardWei: bigint,
  maxRewardWei: bigint,
  onStatus?: (status: TransactionStatus) => void
) {
  return writeAndWait(
    client,
    "set_fee_and_rewards",
    [entryFeeWei, minRewardWei, maxRewardWei],
    0n,
    onStatus
  );
}
