import { TransactionStatus, ExecutionResult, type CalldataEncodable } from 'genlayer-js/types';
import { readClient, getWriteClient, ensureCorrectNetwork } from './genlayerClient';
import { CONTRACT_ADDRESS } from './contract';
import { pick, toBigInt, toNumber, toStr } from './format';
import type {
  ConfigView,
  QuestView,
  PlayerStatsView,
  QuestHistoryView,
  ActiveQuestView,
} from './types';

// ---------------------------------------------------------------------------
// Normalizers
//
// genlayer-js decodes contract dataclass returns into a plain JS object
// keyed by the dataclass's field names (snake_case, matching the Python
// source). These read snake_case defensively and fall back to camelCase.
// NOTE: not yet exercised against a live readContract call — verify field
// names with one real `get_config`/`get_quest` call and adjust if needed.
// ---------------------------------------------------------------------------

function normalizeConfig(raw: any): ConfigView {
  return {
    entryFee: toBigInt(pick(raw, 'entry_fee', 'entryFee')),
    minReward: toBigInt(pick(raw, 'min_reward', 'minReward')),
    maxReward: toBigInt(pick(raw, 'max_reward', 'maxReward')),
    rewardPool: toBigInt(pick(raw, 'reward_pool', 'rewardPool')),
    totalQuestsCreated: toNumber(pick(raw, 'total_quests_created', 'totalQuestsCreated')),
  };
}

function normalizeQuest(raw: any): QuestView {
  return {
    questId: toNumber(pick(raw, 'quest_id', 'questId')),
    player: toStr(pick(raw, 'player', 'player')),
    scenario: toStr(pick(raw, 'scenario', 'scenario')),
    action: toStr(pick(raw, 'action', 'action')),
    status: toNumber(pick(raw, 'status', 'status')) as QuestView['status'],
    statusLabel: toStr(pick(raw, 'status_label', 'statusLabel')),
    creativityScore: toNumber(pick(raw, 'creativity_score', 'creativityScore')),
    reward: toBigInt(pick(raw, 'reward', 'reward')),
    narrativeOutcome: toStr(pick(raw, 'narrative_outcome', 'narrativeOutcome')),
  };
}

function normalizePlayerStats(raw: any): PlayerStatsView {
  return {
    questsStarted: toNumber(pick(raw, 'quests_started', 'questsStarted')),
    questsSucceeded: toNumber(pick(raw, 'quests_succeeded', 'questsSucceeded')),
    questsFailed: toNumber(pick(raw, 'quests_failed', 'questsFailed')),
    totalRewardsEarned: toBigInt(pick(raw, 'total_rewards_earned', 'totalRewardsEarned')),
  };
}

function normalizeHistoryItem(raw: any): QuestHistoryView {
  return {
    questId: toNumber(pick(raw, 'quest_id', 'questId')),
    status: toNumber(pick(raw, 'status', 'status')) as QuestHistoryView['status'],
    statusLabel: toStr(pick(raw, 'status_label', 'statusLabel')),
    creativityScore: toNumber(pick(raw, 'creativity_score', 'creativityScore')),
    reward: toBigInt(pick(raw, 'reward', 'reward')),
  };
}

function normalizeActiveQuest(raw: any): ActiveQuestView {
  return {
    questId: toNumber(pick(raw, 'quest_id', 'questId')),
    player: toStr(pick(raw, 'player', 'player')),
    scenario: toStr(pick(raw, 'scenario', 'scenario')),
    status: toNumber(pick(raw, 'status', 'status')) as ActiveQuestView['status'],
    statusLabel: toStr(pick(raw, 'status_label', 'statusLabel')),
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getOwner(): Promise<string> {
  return String(
    await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_owner', args: [] })
  );
}

export async function getConfig(): Promise<ConfigView> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_config',
    args: [],
  });
  return normalizeConfig(raw);
}

export async function getQuest(questId: number): Promise<QuestView> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_quest',
    args: [questId],
  });
  return normalizeQuest(raw);
}

export async function getPlayerActiveQuest(player: `0x${string}`): Promise<number> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_player_active_quest',
    args: [player],
  });
  return toNumber(raw);
}

export async function getPlayerStats(player: `0x${string}`): Promise<PlayerStatsView> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_player_stats',
    args: [player],
  });
  return normalizePlayerStats(raw);
}

export async function getPlayerHistory(
  player: `0x${string}`,
  limit: number = 0
): Promise<QuestHistoryView[]> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_player_history',
    args: [player, limit],
  });
  return Array.isArray(raw) ? raw.map(normalizeHistoryItem) : [];
}

export async function listActiveQuests(limit: number = 0): Promise<ActiveQuestView[]> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'list_active_quests',
    args: [limit],
  });
  return Array.isArray(raw) ? raw.map(normalizeActiveQuest) : [];
}

// ---------------------------------------------------------------------------
// Writes — send, wait for ACCEPTED, check execution result.
// ---------------------------------------------------------------------------

async function sendWrite(
  address: `0x${string}`,
  functionName: string,
  args: CalldataEncodable[],
  value: bigint = 0n
) {
  const client = await ensureCorrectNetwork(address);
  const hash = await client.writeContract({ address: CONTRACT_ADDRESS, functionName, args, value });

  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED });

  if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error(`Transaction executed but reverted (${functionName}). Check the trace for details.`);
  }

  return { hash, receipt };
}

export async function startQuest(address: `0x${string}`, entryFeeWei: bigint) {
  return sendWrite(address, 'start_quest', [], entryFeeWei); // payable — pass entry_fee as value
}

export async function submitAction(address: `0x${string}`, questId: number, action: string) {
  return sendWrite(address, 'submit_action', [questId, action]);
}

export async function resolveQuest(address: `0x${string}`, questId: number) {
  return sendWrite(address, 'resolve_quest', [questId]);
}

export async function claimReward(address: `0x${string}`, questId: number) {
  return sendWrite(address, 'claim_reward', [questId]);
}

export async function surrenderQuest(address: `0x${string}`) {
  return sendWrite(address, 'surrender_quest', []);
}

export async function fundPool(address: `0x${string}`, amountWei: bigint) {
  return sendWrite(address, 'fund_pool', [], amountWei);
}

export async function setFeeAndRewards(
  address: `0x${string}`,
  entryFee: bigint,
  minReward: bigint,
  maxReward: bigint
) {
  return sendWrite(address, 'set_fee_and_rewards', [entryFee, minReward, maxReward]); // owner-only
}
