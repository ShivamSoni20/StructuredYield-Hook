const bars = [22, 34, 28, 48, 51, 67, 72, 81];

export function FeeChart() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fee history</h2>
          <p className="text-sm text-muted-foreground">YT-LP fee accrual over recent epochs.</p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">Demo</p>
      </div>
      <div className="mt-6 flex h-40 items-end gap-3" aria-label="Fee chart">
        {bars.map((height, index) => (
          <div key={index} className="flex flex-1 items-end rounded-md bg-muted">
            <div className="w-full rounded-md bg-primary" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

