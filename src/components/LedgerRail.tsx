import { weiToGen } from "../lib/format";
import type { ConfigData, PlayerStatsData } from "../lib/contract";
import WaxSeal from "./WaxSeal";

interface LedgerRailProps {
  config: ConfigData | null;
  stats: PlayerStatsData | null;
  connected: boolean;
}

export default function LedgerRail({ config, stats, connected }: LedgerRailProps) {
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-72">
      <section>
        <h2 className="chapter-mark mb-3">Pool Ledger</h2>
        <dl className="space-y-2.5 text-sm">
          <Row label="Entry Fee" value={config ? `${weiToGen(config.entryFee)} GEN` : "…"} />
          <Row
            label="Reward Range"
            value={
              config
                ? `${weiToGen(config.minReward)} – ${weiToGen(config.maxReward)} GEN`
                : "…"
            }
          />
          <Row
            label="Pool Balance"
            value={config ? `${weiToGen(config.rewardPool)} GEN` : "…"}
            emphasize
          />
          <Row
            label="Quests Created"
            value={config ? String(config.totalQuestsCreated) : "…"}
          />
        </dl>
      </section>

      <div className="ledger-rule" />

      <section>
        <h2 className="chapter-mark mb-4">Your Story</h2>
        {!connected ? (
          <p className="text-sm text-parchment-dim/60">
            Connect a wallet or a burner account to see your stats.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <WaxSeal variant="candle" value={stats?.questsStarted ?? 0} label="Started" />
            <WaxSeal variant="moss" value={stats?.questsSucceeded ?? 0} label="Succeeded" />
            <WaxSeal variant="seal" value={stats?.questsFailed ?? 0} label="Failed" />
            <div className="mt-1 border-t border-ink-rule/60 pt-3 text-sm">
              <span className="text-parchment-dim/70">Total Rewards Earned: </span>
              <span className="font-medium text-candle-bright">
                {weiToGen(stats?.totalRewardsEarned ?? 0n)} GEN
              </span>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-parchment-dim/70">{label}</dt>
      <dd className={emphasize ? "font-medium text-candle-bright" : "text-parchment-dim"}>
        {value}
      </dd>
    </div>
  );
}
