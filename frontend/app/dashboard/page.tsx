"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DepositModal } from "@/components/DepositModal";
import { LiveV4Panel } from "@/components/LiveV4Panel";
import { MaturityTimeline } from "@/components/MaturityTimeline";
import { PositionTable } from "@/components/PositionTable";
import { WalletRouteGuard } from "@/components/WalletRouteGuard";
import { YieldMeters } from "@/components/YieldMeters";
import { usePositions } from "@/hooks/usePositions";
import { DEMO_MARKETS } from "@/lib/demo";

type Tab = "portfolio" | "positions" | "markets" | "liquidity" | "trade" | "redeem" | "settings";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMode, setDepositMode] = useState<"new-position" | "add-liquidity">("new-position");
  const [selectedPool, setSelectedPool] = useState<`0x${string}` | undefined>();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { data: positions, isMocked } = usePositions();
  const statusCopy = isMocked
    ? `${positions.length} demo pools · Connect and deposit for live rows`
    : `${positions.length} live position${positions.length === 1 ? "" : "s"} · Unichain Sepolia`;

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
              if (tab === "redeem") {
                router.push("/positions");
                return;
              }
              setActiveTab(tab);
            }}
            onBackHome={() => router.push("/")}
          />

          <section className="dashboard-main">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-serif text-4xl text-white">{titleForTab(activeTab)}</h1>
                <p className="mt-2 text-sm text-zinc-500">{statusCopy} · Last updated just now</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4ade80]">
                  <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  Live
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDepositMode("new-position");
                    setSelectedPool(undefined);
                    setDepositOpen(true);
                  }}
                  className="min-h-11 rounded-xl bg-[#d4a853] px-5 font-semibold text-[#0a0b0d] transition hover:bg-[#f0c878]"
                >
                  + New Position
                </button>
              </div>
            </div>

            {activeTab === "portfolio" ? <PortfolioContent /> : null}
            {activeTab === "positions" ? <PositionTable /> : null}
            {activeTab === "markets" ? (
              <MarketsContent
                onDeposit={(poolId) => {
                  setDepositMode("add-liquidity");
                  setSelectedPool(poolId);
                  setDepositOpen(true);
                }}
              />
            ) : null}
            {activeTab === "liquidity" ? (
              <LiquidityContent
                onDeposit={(poolId) => {
                  setDepositMode("add-liquidity");
                  setSelectedPool(poolId);
                  setDepositOpen(true);
                }}
              />
            ) : null}
            {activeTab === "trade" ? <LiveV4Panel /> : null}
            {activeTab === "redeem" ? <InfoPanel title="Redeem PT-LP" body="Select a matured position, review IL coverage, then confirm redemption from the position detail screen." /> : null}
            {activeTab === "settings" ? <InfoPanel title="Settings" body="Use the wallet button to switch networks, inspect balance, or disconnect. Contract addresses are loaded from frontend environment variables. The latest local contracts support real USDC vault custody; redeploy and fund the vault before relying on the live testnet solvency path." /> : null}
          </section>
        </div>

        <DepositModal
          open={depositOpen}
          onClose={() => setDepositOpen(false)}
          mode={depositMode}
          poolId={selectedPool}
          onSuccess={() => {
            setToast({ message: "PT-LP and YT-LP minted successfully!", type: "success" });
            window.setTimeout(() => setToast(null), 4000);
          }}
        />
        {toast ? (
          <div
            className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold shadow-2xl ${
              toast.type === "success" ? "bg-[#4ade80] text-[#052e16]" : "bg-[#f87171] text-[#450a0a]"
            }`}
          >
            {toast.message}
          </div>
        ) : null}
      </main>
    </WalletRouteGuard>
  );
}

function PortfolioContent() {
  return (
    <div className="space-y-6">
      <LiveV4Panel />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <YieldMeters />
        <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
          <h2 className="mb-6 font-semibold text-white">Upcoming Maturities</h2>
          <MaturityTimeline />
        </section>
      </div>
      <PositionTable />
    </div>
  );
}

function MarketsContent({ onDeposit }: { onDeposit: (poolId: `0x${string}`) => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <h2 className="font-semibold text-white">Pool Markets</h2>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">Browse live and demo StructuredYield markets. Use Add Liquidity only when you want to fund an existing pool.</p>
      <div className="mt-6 grid gap-4">
        {DEMO_MARKETS.map((market) => (
          <div key={market.poolId} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-white">{market.pair}</p>
              <p className="mt-1 text-sm text-zinc-500">Maturity {market.maturity} · Vol {market.volBps} bps · Premium {market.premiumBps} bps · TVL {market.tvl}</p>
            </div>
            <button type="button" onClick={() => onDeposit(market.poolId)} className="min-h-10 rounded-lg bg-[#d4a853] px-4 font-semibold text-[#0a0b0d]">Add Liquidity</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LiquidityContent({ onDeposit }: { onDeposit: (poolId: `0x${string}`) => void }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#d4a853]/25 bg-[#111318] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#d4a853]/10 px-3 py-1 text-xs font-semibold text-[#d4a853]">Existing pool funding</p>
            <h2 className="mt-4 font-serif text-3xl text-white">Add liquidity to a StructuredYield pool</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              This page is only for adding liquidity to an already initialized pool. If you want the default guided flow, use the + New Position button instead.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDeposit(DEMO_MARKETS[0].poolId)}
            className="min-h-11 rounded-xl bg-[#d4a853] px-5 font-semibold text-[#0a0b0d] transition hover:bg-[#f0c878]"
          >
            Add ETH/USDC Liquidity
          </button>
        </div>
      </section>

      <LiveV4Panel />

      <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
        <h2 className="font-semibold text-white">Available Pools</h2>
        <div className="mt-6 grid gap-4">
          {DEMO_MARKETS.map((market) => (
            <article key={market.poolId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">{market.pair}</p>
                  <p className="mt-1 text-sm text-zinc-500">Maturity {market.maturity} · Vol {market.volBps} bps · Premium {market.premiumBps} bps · TVL {market.tvl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeposit(market.poolId)}
                  className="min-h-10 rounded-lg border border-[#d4a853]/30 px-4 font-semibold text-[#d4a853] transition hover:bg-[#d4a853]/10"
                >
                  Add Liquidity
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
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
    liquidity: "Add Liquidity",
    trade: "Trade YT-LP",
    redeem: "Redeem PT-LP",
    settings: "Settings"
  };
  return titles[tab];
}
