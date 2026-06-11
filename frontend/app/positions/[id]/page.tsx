"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ClaimFeesButton } from "@/components/ClaimFeesButton";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DepositModal } from "@/components/DepositModal";
import { ILStatusBadge } from "@/components/ILStatusBadge";
import { PTYTSplitVisual } from "@/components/PTYTSplitVisual";
import { RedeemModal } from "@/components/RedeemModal";
import { VaultSolvencyCard } from "@/components/VaultSolvencyCard";
import { WalletRouteGuard } from "@/components/WalletRouteGuard";
import { usePosition } from "@/hooks/usePositions";
import { DEMO_POSITIONS } from "@/lib/demo";
import { formatBps, formatCurrency, formatDuration } from "@/lib/math";

export default function PositionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: `0x${string}` }>();
  const poolId = params.id ?? DEMO_POSITIONS[0].poolId;
  const [depositOpen, setDepositOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const { data: position } = usePosition(poolId);
  const demoMeta = DEMO_POSITIONS.find((item) => item.poolId === poolId) ?? DEMO_POSITIONS[0];

  return (
    <WalletRouteGuard>
      <main className="min-h-screen bg-[#0a0b0d] text-zinc-100">
        <header className="border-b border-white/10 bg-[#0a0b0d]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-zinc-500">{demoMeta.poolName}</p>
              <h1 className="mt-2 font-serif text-5xl text-white">{formatCurrency(position.depositedValue)}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ILStatusBadge isVaultSolvent={position.isVaultSolvent} currentILAmount={position.currentILAmount} />
                <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-zinc-300">
                  {position.secondsToMaturity === 0n ? "MATURED" : `${formatDuration(position.secondsToMaturity)} remaining`}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setDepositOpen(true)} className="min-h-11 rounded-xl border border-white/15 px-4 font-semibold text-zinc-200 hover:bg-white/10">
                Add More Liquidity
              </button>
              <button type="button" onClick={() => setRedeemOpen(true)} className="min-h-11 rounded-xl bg-[#d4a853] px-4 font-semibold text-[#0a0b0d]">
                Redeem at Maturity
              </button>
            </div>
          </div>

          <section className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
                <h2 className="font-semibold text-white">PT/YT Split</h2>
                <div className="mt-6">
                  <PTYTSplitVisual pt={position.ptBalance} yt={position.ytBalance} />
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Deposited Value" value={formatCurrency(position.depositedValue)} />
                <Metric label="PT Balance" value={formatCurrency(position.ptBalance)} />
                <Metric label="YT Balance" value={formatCurrency(position.ytBalance)} />
                <Metric label="Current IL" value={`${formatBps(position.currentILBps)} · ${formatCurrency(position.currentILAmount)}`} />
                <Metric label="Accrued Fees" value={formatCurrency(position.accruedFees)} />
                <Metric label="Fixed APY" value={formatBps(position.estimatedFixedAPY)} />
              </section>
            </div>

            <aside className="space-y-6">
              <VaultSolvencyCard poolId={poolId} liability={position.currentILAmount} isSolvent={position.isVaultSolvent} />
              <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
                <h2 className="font-semibold text-white">Actions</h2>
                <div className="mt-5 space-y-3">
                  <ClaimFeesButton poolId={poolId} />
                  <button
                    type="button"
                    onClick={() => setRedeemOpen(true)}
                    disabled={position.secondsToMaturity > 0n}
                    className="min-h-11 w-full rounded-xl bg-[#d4a853] px-4 font-semibold text-[#0a0b0d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {position.secondsToMaturity > 0n ? `Matures in ${formatDuration(position.secondsToMaturity)}` : "Redeem at Maturity"}
                  </button>
                  <button type="button" onClick={() => router.push("/dashboard")} className="min-h-11 w-full rounded-xl border border-white/15 px-4 font-semibold text-zinc-200 hover:bg-white/10">
                    Back to Dashboard
                  </button>
                </div>
              </section>
            </aside>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6">
            <h2 className="font-semibold text-white">Fee History</h2>
            <p className="mt-2 text-sm text-zinc-500">Connect the subgraph to see per-position fee accrual events.</p>
          </section>
        </div>

        <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} mode="add-liquidity" poolId={poolId} />
        <RedeemModal open={redeemOpen} onClose={() => setRedeemOpen(false)} poolId={poolId} />
      </main>
    </WalletRouteGuard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111318] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-3 font-mono text-lg font-semibold text-white">{value}</p>
    </article>
  );
}
