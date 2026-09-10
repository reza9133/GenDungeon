interface WaxSealProps {
  value: string | number;
  label: string;
  variant?: "seal" | "moss" | "candle";
}

const VARIANT_CLASS: Record<string, string> = {
  seal: "wax-seal",
  moss: "wax-seal wax-seal--moss",
  candle: "wax-seal wax-seal--candle",
};

export default function WaxSeal({ value, label, variant = "seal" }: WaxSealProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={VARIANT_CLASS[variant]}>{value}</div>
      <span className="text-sm text-parchment-dim/80">{label}</span>
    </div>
  );
}
