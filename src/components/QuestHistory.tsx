import { weiToGen } from "../lib/format";
import { QuestStatus, type QuestHistoryItem } from "../lib/contract";

export default function QuestHistory({ items }: { items: QuestHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-parchment-dim/50">
        No chapter written yet — start your first quest.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-e border-ink-rule/70 pe-6">
      {items.map((item) => (
        <li key={item.questId} className="relative py-3">
          <span
            className={`absolute top-4 h-2.5 w-2.5 rounded-full ${dotColor(
              item.status
            )}`}
            style={{ insetInlineEnd: "-7px" }}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-display text-parchment/90">
              Chapter {item.questId}
            </span>
            <span className={`text-xs ${labelColor(item.status)}`}>
              {item.statusLabel}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-parchment-dim/60">
            Creativity {item.creativityScore}/100
            {item.status === QuestStatus.SUCCESS || item.status === QuestStatus.CLAIMED ? (
              <> · Reward {weiToGen(item.reward)} GEN</>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function dotColor(status: number) {
  if (status === QuestStatus.SUCCESS || status === QuestStatus.CLAIMED) return "bg-moss-bright";
  if (status === QuestStatus.FAILED) return "bg-seal-bright";
  return "bg-candle-bright";
}

function labelColor(status: number) {
  if (status === QuestStatus.SUCCESS || status === QuestStatus.CLAIMED) return "text-moss-bright";
  if (status === QuestStatus.FAILED) return "text-seal-bright";
  return "text-candle-bright";
}
