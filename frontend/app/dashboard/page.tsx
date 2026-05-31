"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DepositModal } from "@/components/DepositModal";
import { FeeChart } from "@/components/FeeChart";
import { PositionCard } from "@/components/PositionCard";
import { YieldMeter } from "@/components/YieldMeter";
import { usePosition } from "@/hooks/usePositions";
import { formatBps, formatCurrency } from "@/lib/math";

export default function DashboardPage() {
  const [depositOpen, setDepositOpen] = useState(false);
  const { data: position } = usePosition();

  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            StructuredYield
          </Link>
          <ConnectWallet />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Track principal, fee yield, IL coverage, and maturity.</p>
          </div>
          <button
            type="button"
            onClick={() => setDepositOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New position
          </button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric label="Total value locked" value={formatCurrency(position.depositedValue)} />
          <Metric label="Fixed APY" value={formatBps(position.estimatedFixedAPY)} />
          <Metric label="YT fees earned" value={formatCurrency(position.accruedFees)} />
          <Metric label="IL protected" value={formatCurrency(position.currentILAmount)} />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <PositionCard />
            <FeeChart />
          </div>
          <aside className="space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold">Yield meters</h2>
              <div className="mt-6 space-y-5">
                <YieldMeter label="Fee APY" value={12.4} max={50} />
                <YieldMeter label="Fixed APY" value={Number(position.estimatedFixedAPY) / 100} max={30} />
                <YieldMeter label="IL covered" value={Number(position.currentILBps) / 100} max={15} />
              </div>
            </section>
          </aside>
        </div>
      </div>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
    </article>
  );
}

