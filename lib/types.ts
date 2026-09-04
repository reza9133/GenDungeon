export const QuestStatus = {
  ACTIVE: 0,
  SUBMITTED: 1,
  SUCCESS: 2,
  FAILED: 3,
  CLAIMED: 4,
} as const;

export type QuestStatusCode = (typeof QuestStatus)[keyof typeof QuestStatus];

export interface ConfigView {
  entryFee: bigint;
  minReward: bigint;
  maxReward: bigint;
  rewardPool: bigint;
  totalQuestsCreated: number;
}

export interface QuestView {
  questId: number;
  player: string;
  scenario: string;
  action: string;
  status: QuestStatusCode;
  statusLabel: string;
  creativityScore: number;
  reward: bigint;
  narrativeOutcome: string;
}

export interface PlayerStatsView {
  questsStarted: number;
  questsSucceeded: number;
  questsFailed: number;
  totalRewardsEarned: bigint;
}

export interface QuestHistoryView {
  questId: number;
  status: QuestStatusCode;
  statusLabel: string;
  creativityScore: number;
  reward: bigint;
}

export interface ActiveQuestView {
  questId: number;
  player: string;
  scenario: string;
  status: QuestStatusCode;
  statusLabel: string;
}
