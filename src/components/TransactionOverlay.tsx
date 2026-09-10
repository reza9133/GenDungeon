import { TransactionStatus } from "genlayer-js/types";

interface TransactionOverlayProps {
  title: string;
  status: TransactionStatus | null;
  error: string | null;
  onDismiss: () => void;
}

const NARRATION: Partial<Record<TransactionStatus, string>> = {
  [TransactionStatus.PENDING]: "The scroll has joined the monastery gate queue…",
  [TransactionStatus.PROPOSING]: "A scribe is writing the first draft…",
  [TransactionStatus.COMMITTING]: "Other scribes are sealing their copies…",
  [TransactionStatus.REVEALING]: "Seals are broken and copies are compared…",
  [TransactionStatus.ACCEPTED]: "The chapter has been provisionally recorded.",
  [TransactionStatus.FINALIZED]: "The ink has dried. The chapter is final.",
  [TransactionStatus.UNDETERMINED]: "The scribes could not agree — the page stayed blank.",
  [TransactionStatus.LEADER_TIMEOUT]: "The first scribe did not write in time; another is being chosen…",
  [TransactionStatus.VALIDATORS_TIMEOUT]: "Some scribes did not vote in time; the monastery is trying again…",
  [TransactionStatus.CANCELED]: "The scroll was withdrawn.",
};

export default function TransactionOverlay({
  title,
  status,
  error,
  onDismiss,
}: TransactionOverlayProps) {
  const failed =
    !!error ||
    status === TransactionStatus.UNDETERMINED ||
    status === TransactionStatus.CANCELED;
  const settled = status === TransactionStatus.ACCEPTED || status === TransactionStatus.FINALIZED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm">
      <div className="manuscript-page w-full max-w-md">
        <div className="manuscript-inner text-center">
          <div
            className={`mx-auto mb-5 h-3 w-3 rounded-full bg-candle ${
              settled || failed ? "" : "candle-flicker"
            }`}
          />
          <h3 className="font-display text-lg italic text-ink">{title}</h3>

          <p className="mt-4 min-h-[3.5rem] text-sm text-iron">
            {error
              ? error
              : status
              ? NARRATION[status] ?? "Processing…"
              : "Sending the scroll…"}
          </p>

          {!settled && !failed && (
            <div className="mt-2 flex justify-center gap-1.5 text-candle-dim">
              <span className="scribe-copy">✒</span>
              <span className="scribe-copy" style={{ animationDelay: "0.3s" }}>
                ✒
              </span>
              <span className="scribe-copy" style={{ animationDelay: "0.6s" }}>
                ✒
              </span>
            </div>
          )}

          {(settled || failed) && (
            <button
              onClick={onDismiss}
              className="mt-6 rounded-full bg-ink px-5 py-2 text-sm text-parchment transition hover:bg-ink-soft"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
