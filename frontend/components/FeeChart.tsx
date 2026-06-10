"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useFeeHistory } from "@/hooks/useFeeHistory";
import { DEMO_FEE_HISTORY } from "@/lib/demo";

export function FeeChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const { data: feeRoutes, isError } = useFeeHistory();
  const liveHistory = (feeRoutes ?? []).map((item) => ({
    month: new Date(Number(item.timestamp) * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: Number(formatUnits(BigInt(item.feeAmount), 6))
  }));
  const history = liveHistory.length > 0 ? liveHistory : DEMO_FEE_HISTORY;
  const max = Math.max(...history.map((item) => item.value), 1);
  const isLive = liveHistory.length > 0 && !isError;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-semibold text-white">Fee Revenue → YT-LP</h2>
          <p className="text-sm text-zinc-500">{isLive ? "Loaded from the configured subgraph." : "Fallback demo data until subgraph is connected."}</p>
        </div>
        <p className="font-mono text-sm text-zinc-500">{isLive ? "Live" : "Demo"}</p>
      </div>
      <div className="mt-6 flex h-40 items-end gap-3" aria-label="Fee chart">
        {history.map((item, index) => (
          <div
            key={item.month}
            className="relative flex flex-1 flex-col items-center gap-2"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === index ? (
              <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1c2030] px-2 py-1 font-mono text-xs text-zinc-200 shadow-lg">
                {item.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
            ) : null}
            <div className="flex h-36 w-full items-end rounded-md bg-white/5">
              <div
                className={`w-full rounded-md ${index === history.length - 1 ? "bg-[#d4a853]" : "bg-[#2dd4bf]/70"}`}
                style={{ height: `${(item.value / max) * 100}%` }}
                aria-label={`${item.month}: ${item.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
              />
            </div>
            <span className="font-mono text-[10px] text-zinc-500">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
