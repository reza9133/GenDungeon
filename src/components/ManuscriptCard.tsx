import { useState } from "react";
import { weiToGen } from "../lib/format";
import { QuestStatus, type ConfigData, type QuestData } from "../lib/contract";

interface ManuscriptCardProps {
  connected: boolean;
  config: ConfigData | null;
  quest: QuestData | null;
  busy: boolean;
  onStartQuest: () => void;
  onSubmitAction: (action: string) => void;
  onResolve: () => void;
  onClaim: () => void;
  onSurrender: () => void;
}

export default function ManuscriptCard({
  connected,
  config,
  quest,
  busy,
  onStartQuest,
  onSubmitAction,
  onResolve,
  onClaim,
  onSurrender,
}: ManuscriptCardProps) {
  const [draft, setDraft] = useState("");

  return (
    <div className="manuscript-page">
      <div className="manuscript-inner min-h-[22rem]">
        {!connected && <NoWallet />}

        {connected && !quest && (
          <NoQuest config={config} busy={busy} onStartQuest={onStartQuest} />
        )}

        {connected && quest && quest.status === QuestStatus.ACTIVE && (
          <ActiveQuest
            quest={quest}
            draft={draft}
            onDraftChange={setDraft}
            busy={busy}
            onSubmit={() => onSubmitAction(draft)}
            onSurrender={onSurrender}
          />
        )}

        {connected && quest && quest.status === QuestStatus.SUBMITTED && (
          <SubmittedQuest quest={quest} busy={busy} onResolve={onResolve} />
        )}

        {connected &&
          quest &&
          (quest.status === QuestStatus.SUCCESS || quest.status === QuestStatus.FAILED) && (
            <ResolvedQuest quest={quest} busy={busy} onClaim={onClaim} onStartNext={onStartQuest} />
          )}
      </div>
    </div>
  );
}

function NoWallet() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <p className="chapter-mark mb-3">Open Manuscript</p>
      <p className="max-w-sm text-iron/80">
        Connect a wallet or a burner account from the header above to open your first chapter.
      </p>
    </div>
  );
}

function NoQuest({
  config,
  busy,
  onStartQuest,
}: {
  config: ConfigData | null;
  busy: boolean;
  onStartQuest: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
      <p className="chapter-mark">Blank Page</p>
      <h1 className="max-w-md font-display text-2xl leading-relaxed text-ink">
        No obstacle has been written for you yet.
      </h1>
      <p className="max-w-sm text-sm text-iron/70">
        By paying {config ? weiToGen(config.entryFee) : "…"} GEN, the AI scribes will pen a unique chapter for you.
      </p>
      <button
        onClick={onStartQuest}
        disabled={busy}
        className="mt-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-parchment shadow-md transition hover:bg-ink-soft disabled:opacity-50"
      >
        Start a New Quest
      </button>
    </div>
  );
}

function ActiveQuest({
  quest,
  draft,
  onDraftChange,
  busy,
  onSubmit,
  onSurrender,
}: {
  quest: QuestData;
  draft: string;
  onDraftChange: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onSurrender: () => void;
}) {
  return (
    <div>
      <p className="chapter-mark">Chapter {quest.questId}</p>
      <p
        className="quill-cursor mt-3 font-display text-lg leading-relaxed text-ink"
      >
        {quest.scenario}
      </p>

      <label className="mt-7 block text-sm font-medium text-iron/80">
        How will you face this obstacle?
      </label>
      <textarea
        dir="auto"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Describe your action in detail and with creativity…"
        className="mt-2 w-full resize-none rounded-md border border-iron/25 bg-parchment/60 p-3 text-sm text-ink placeholder:text-iron/40 focus:border-candle-dim focus:outline-none"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={busy || draft.trim().length === 0}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-parchment transition hover:bg-ink-soft disabled:opacity-50"
        >
          Face the Obstacle
        </button>
        <button
          onClick={onSurrender}
          disabled={busy}
          className="rounded-full border border-seal/50 px-5 py-2.5 text-sm text-seal transition hover:bg-seal/10 disabled:opacity-50"
        >
          Flee the Quest
        </button>
      </div>
    </div>
  );
}

function SubmittedQuest({
  quest,
  busy,
  onResolve,
}: {
  quest: QuestData;
  busy: boolean;
  onResolve: () => void;
}) {
  return (
    <div>
      <p className="chapter-mark">Chapter {quest.questId}</p>
      <p className="mt-3 font-display text-lg leading-relaxed text-ink/70">
        {quest.scenario}
      </p>
      <div className="mt-5 rounded-md border border-iron/15 bg-ink/5 p-4">
        <p className="text-xs uppercase tracking-wide text-iron/50">Your Action</p>
        <p className="mt-1 text-sm text-ink/80">
          {quest.action}
        </p>
      </div>
      <p className="mt-6 text-sm italic text-iron/60">
        The validator scribes are transcribing and comparing this chapter's fate…
      </p>
      <button
        onClick={onResolve}
        disabled={busy}
        className="mt-4 rounded-full bg-candle px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-candle-bright disabled:opacity-50"
      >
        Call for Scribe Judgment
      </button>
    </div>
  );
}

function ResolvedQuest({
  quest,
  busy,
  onClaim,
  onStartNext,
}: {
  quest: QuestData;
  busy: boolean;
  onClaim: () => void;
  onStartNext: () => void;
}) {
  const success = quest.status === QuestStatus.SUCCESS;
  return (
    <div>
      <p className={`chapter-mark ${success ? "" : "text-seal"}`}>
        Chapter {quest.questId} · {success ? "Victory" : "Defeat"}
      </p>
      <p className="mt-3 font-display text-lg leading-relaxed text-ink">
        {quest.narrativeOutcome || quest.scenario}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-iron/70">
        <span>Creativity Score: {quest.creativityScore}/100</span>
        {success && (
          <span className="font-medium text-moss">
            Reward: {weiToGen(quest.reward)} GEN
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {success ? (
          <button
            onClick={onClaim}
            disabled={busy}
            className="rounded-full bg-moss px-6 py-2.5 text-sm font-medium text-parchment transition hover:bg-moss-bright disabled:opacity-50"
          >
            Claim Reward
          </button>
        ) : (
          <button
            onClick={onStartNext}
            disabled={busy}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-parchment transition hover:bg-ink-soft disabled:opacity-50"
          >
            Start Another Quest
          </button>
        )}
      </div>
    </div>
  );
}
