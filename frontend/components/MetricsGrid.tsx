"use client";

import type { ReactNode } from "react";
import { ShieldCheck, TrendingUp, Wallet, Waves } from "lucide-react";
import { usePositions } from "@/hooks/usePositions";
import { formatBps, formatCurrency } from "@/lib/math";

export function MetricsGrid() {
  const { data: positions, isMocked } = usePositions();
  const totalValue = positions.reduce((sum, position) => sum + position.depositedValue, 0n);
  const feesEarned = positions.reduce((sum, position) => sum + position.accruedFees, 0n);
  const ilProtected = positions.reduce((sum, position) => sum + (position.isVaultSolvent ? position.currentILAmount : 0n), 0n);
  const avgApy = positions.length
    ? positions.reduce((sum, position) => sum + Number(position.estimatedFixedAPY), 0) / positions.length
    : 0;

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Wallet />} label="Total Value Locked" value={formatCurrency(totalValue)} delta="+2.3% this week" />
        <Metric icon={<TrendingUp />} label="Avg Fixed APY" value={formatBps(avgApy)} delta="+0.4% vs last epoch" accent="gold" />
        <Metric icon={<Waves />} label="YT-LP Fees Earned" value={formatCurrency(feesEarned)} delta="+12% this month" accent="teal" />
        <Metric icon={<ShieldCheck />} label="IL Protected" value={formatCurrency(ilProtected)} delta="Insurance Active" accent="green" />
      </div>
      {isMocked ? (
        <p className="mt-2 text-xs text-zinc-600">Showing demo data. Connect wallet on Unichain Sepolia and deposit to see live metrics.</p>
      ) : (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#4ade80]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          Live data from Unichain Sepolia
        </p>
      )}
    </section>
  );
}

function Metric({ icon, label, value, delta, accent = "white" }: { icon: ReactNode; label: string; value: string; delta: string; accent?: "white" | "gold" | "teal" | "green" }) {
  const color = accent === "gold" ? "text-[#d4a853]" : accent === "teal" ? "text-[#2dd4bf]" : accent === "green" ? "text-[#4ade80]" : "text-white";
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111318] p-5">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400">{icon}</div>
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className={`mt-3 font-mono text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-3 text-xs font-semibold text-[#4ade80]">{delta}</p>
    </article>
  );
}
