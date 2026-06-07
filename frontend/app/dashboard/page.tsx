"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DepositModal } from "@/components/DepositModal";
import { FeeChart } from "@/components/FeeChart";
import { MaturityTimeline } from "@/components/MaturityTimeline";
import { MetricsGrid } from "@/components/MetricsGrid";
import { PositionTable } from "@/components/PositionTable";
import { RedeemModal } from "@/components/RedeemModal";
import { WalletRouteGuard } from "@/components/WalletRouteGuard";
import { YieldMeters } from "@/components/YieldMeters";
import { DEMO_MARKETS } from "@/lib/demo";

type Tab = "portfolio" | "positions" | "markets" | "trade" | "redeem" | "settings";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [depositOpen, setDepositOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);

  return (
    <WalletRouteGuard>
      <main className="min-h-screen bg-[#0a0b0d] text-zinc-100">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0b0d]/90 backdrop-blur-xl">
          <div className="flex h-[60px] items-center justify-between px-4 md:px-8">
            <button type="button" onClick={() => router.push("/")} className="flex items-center gap-3 font-semibold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4a853] font-mono text-sm font-bold text-[#0a0b0d]">SY</span>
              StructuredYield
            </button>
            <ConnectWallet />
          </div>
        </header>

        <div className="dashboard-layout pt-[60px]">
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab === "redeem") setRedeemOpen(true);
            }}
            onNewPosition={() => setDepositOpen(true)}
            onBackHome={() => router.push("/")}
          />

          <section className="dashboard-main">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-serif text-4xl text-white">{titleForTab(activeTab)}</h1>
                <p className="mt-2 text-sm text-zinc-500">All positions · 3 active pools · Last updated just now</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4ade80]">
                  <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  Live
                </span>
                <button
                  type="button"
                  onClick={() => setDepositOpen(true)}
                  className="min-h-11 rounded-xl bg-[#d4a853] px-5 font-semibold text-[#0a0b0d] transition hover:bg-[#f0c878]"
                >
                  + New Position
                </button>
              </div>
            </div>

            {activeTab === "portfolio" ? <PortfolioContent /> : null}
            {activeTab === "positions" ? <PositionTable /> : null}
            {activeTab === "markets" ? <MarketsContent onDeposit={() => setDepositOpen(true)} /> : null}
            {activeTab === "trade" ? <InfoPanel title="Trade YT-LP" body="YT-LP secondary-market routing is demo-ready. For live swaps, route through Uniswap once a production V4 PoolManager deployment is wired." /> : null}
            {activeTab === "redeem" ? <InfoPanel title="Redeem PT-LP" body="Select a matured position, review IL coverage, then confirm redemption from the position detail screen." /> : null}
            {activeTab === "settings" ? <InfoPanel title="Settings" body="Use the wallet button to switch networks, inspect balance, or disconnect. Contract addresses are loaded from frontend environment variables." /> : null}
          </section>
        </div>

        <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
        <RedeemModal open={redeemOpen} onClose={() => setRedeemOpen(false)} poolId={DEMO_MARKETS[0].poolId} />
      </main>
    </WalletRouteGuard>
  );
}

function PortfolioContent() {
  return (
    <div className="space-y-6">
      <MetricsGrid />
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <FeeChart />
        <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
          <h2 className="mb-6 font-semibold text-white">Upcoming Maturities</h2>
          <MaturityTimeline />
        </section>
      </div>
      <YieldMeters />
      <PositionTable />
    </div>
  );
}

function MarketsContent({ onDeposit }: { onDeposit: () => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <h2 className="font-semibold text-white">Pool Markets</h2>
      <div className="mt-6 grid gap-4">
        {DEMO_MARKETS.map((market) => (
          <div key={market.poolId} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-white">{market.pair}</p>
              <p className="mt-1 text-sm text-zinc-500">Maturity {market.maturity} · Vol {market.volBps} bps · Premium {market.premiumBps} bps · TVL {market.tvl}</p>
            </div>
            <button type="button" onClick={onDeposit} className="min-h-10 rounded-lg bg-[#d4a853] px-4 font-semibold text-[#0a0b0d]">Deposit</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{body}</p>
    </section>
  );
}

function titleForTab(tab: Tab) {
  const titles: Record<Tab, string> = {
    portfolio: "Portfolio Overview",
    positions: "My Positions",
    markets: "Markets",
    trade: "Trade YT-LP",
    redeem: "Redeem PT-LP",
    settings: "Settings"
  };
  return titles[tab];
}
