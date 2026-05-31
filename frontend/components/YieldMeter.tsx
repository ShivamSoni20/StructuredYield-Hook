type Props = {
  label: string;
  value: number;
  max: number;
};

export function YieldMeter({ label, value, max }: Props) {
  const width = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-mono text-sm text-muted-foreground">{value.toFixed(2)}%</p>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

