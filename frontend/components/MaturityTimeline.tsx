"use client";

import { usePositions } from "@/hooks/usePositions";
import { formatCurrency, formatDuration } from "@/lib/math";

export function MaturityTimeline() {
  const { data: positions, isMocked } = usePositions();

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">{isMocked ? "Demo maturity schedule" : "Live wallet maturity schedule"}</p>
      <ol className="space-y-4">
        {[...positions].sort((a, b) => Number(a.secondsToMaturity - b.secondsToMaturity)).map((position, index) => (
          <li key={position.poolId} className="relative border-l border-white/10 pl-5">
            <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#d4a853]" : index === 1 ? "bg-[#2dd4bf]" : "bg-zinc-500"}`} />
            <p className="font-semibold text-white">{position.poolName}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              {position.maturityDate} · {formatDuration(position.secondsToMaturity)}
            </p>
            <p className="mt-1 font-mono text-sm text-[#d4a853]">{formatCurrency(position.ptBalance)} PT-LP</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
