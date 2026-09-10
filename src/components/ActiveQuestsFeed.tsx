import { shortAddress } from "../lib/format";
import { QuestStatus, type ActiveQuestItem } from "../lib/contract";

export default function ActiveQuestsFeed({ items }: { items: ActiveQuestItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-parchment-dim/50">
        No adventurer is currently in battle.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.questId}
          className="rounded-lg border border-ink-rule/70 bg-ink-soft/60 p-4"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-candle-dim">Chapter {item.questId}</span>
            <span
              className={
                item.status === QuestStatus.SUBMITTED
                  ? "text-candle-bright"
                  : "text-parchment-dim/60"
              }
            >
              {item.statusLabel}
            </span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-parchment-dim/80">
            {item.scenario}
          </p>
          <p className="mt-2 text-xs text-parchment-dim/40">
            Adventurer: {shortAddress(item.player)}
          </p>
        </li>
      ))}
    </ul>
  );
}
