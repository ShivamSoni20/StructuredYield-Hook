import { DEMO_FEE_HISTORY } from "@/lib/demo";

export function FeeChart() {
  const max = Math.max(...DEMO_FEE_HISTORY.map((item) => item.value));

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-semibold text-white">Monthly Fee Revenue → YT-LP</h2>
          <p className="text-sm text-zinc-500">Fallback demo data until subgraph is connected.</p>
        </div>
        <p className="font-mono text-sm text-zinc-500">Demo</p>
      </div>
      <div className="mt-6 flex h-40 items-end gap-3" aria-label="Fee chart">
        {DEMO_FEE_HISTORY.map((item, index) => (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end rounded-md bg-white/5">
              <div
                className={`w-full rounded-md ${index === DEMO_FEE_HISTORY.length - 1 ? "bg-[#d4a853]" : "bg-[#2dd4bf]/70"}`}
                style={{ height: `${(item.value / max) * 100}%` }}
                title={`$${item.value.toLocaleString()}`}
              />
            </div>
            <span className="font-mono text-[10px] text-zinc-500">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
