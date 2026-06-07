"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { usePosition } from "@/hooks/usePositions";
import { DEMO_POSITIONS } from "@/lib/demo";
import { formatBps, formatCurrency, formatDuration } from "@/lib/math";
import { PTYTSplitVisual } from "@/components/PTYTSplitVisual";

export function PositionCard() {
  const { data: position, isError, isLoading, isMocked, refetch } = usePosition();

  if (isLoading) {
    return <div className="h-80 rounded-lg border bg-card p-6 animate-pulse" aria-label="Loading position" />;
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-card p-6">
        <p className="font-medium text-destructive">Couldn&apos;t load your position</p>
        <p className="mt-1 text-sm text-muted-foreground">Check your RPC connection or try again in a moment.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 min-h-10 rounded-md border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="fade-in rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Active ETH / USDC position</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(position.ptBalance)}</h2>
          {isMocked ? <p className="mt-1 text-xs text-muted-foreground">Showing demo data until contracts are deployed.</p> : null}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {position.isVaultSolvent ? "Vault solvent" : "Partial coverage"}
        </div>
      </div>

      <div className="mt-6">
        <PTYTSplitVisual pt={position.ptBalance} yt={position.ytBalance} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Fixed APY" value={formatBps(position.estimatedFixedAPY)} />
        <Metric label="Current IL" value={formatBps(position.currentILBps)} />
        <Metric label="Maturity" value={formatDuration(position.secondsToMaturity)} />
      </dl>

      <Link
        href={`/positions/${DEMO_POSITIONS[0].poolId}`}
        className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        View position
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
    </div>
  );
}
