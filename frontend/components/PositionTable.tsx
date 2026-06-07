"use client";

import { useRouter } from "next/navigation";
import { ILStatusBadge } from "@/components/ILStatusBadge";
import { usePositions } from "@/hooks/usePositions";
import { formatBps, formatCurrency, formatDuration } from "@/lib/math";

export function PositionTable() {
  const router = useRouter();
  const { data: positions } = usePositions();

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">Active Positions</h2>
          <p className="text-sm text-zinc-500">Manage principal, fees, IL coverage, and maturity.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            <tr>
              <th className="pb-4">Pool</th>
              <th className="pb-4">PT-LP Value</th>
              <th className="pb-4">YT-LP Earned</th>
              <th className="pb-4">Fixed APY</th>
              <th className="pb-4">IL Status</th>
              <th className="pb-4">Maturity</th>
              <th className="pb-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {positions.map((position) => (
              <tr key={position.poolId}>
                <td className="py-4 font-semibold text-white">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#d4a853]" />
                  {position.poolName}
                </td>
                <td className="py-4 font-mono text-zinc-200">{formatCurrency(position.ptBalance)}</td>
                <td className="py-4 font-mono text-[#2dd4bf]">{formatCurrency(position.accruedFees)}</td>
                <td className="py-4 font-mono text-[#d4a853]">{formatBps(position.estimatedFixedAPY)}</td>
                <td className="py-4"><ILStatusBadge isVaultSolvent={position.isVaultSolvent} currentILAmount={position.currentILAmount} /></td>
                <td className="py-4 font-mono text-zinc-400">{formatDuration(position.secondsToMaturity)}</td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => router.push(`/positions/${position.poolId}`)}
                    className="min-h-9 rounded-lg border border-white/15 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
