"use client";

import Link from "next/link";
import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DepositModal } from "@/components/DepositModal";
import { DEMO_MARKETS } from "@/lib/demo";

export default function MarketsPage() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<`0x${string}`>(DEMO_MARKETS[0].poolId);

  return (
    <main className="min-h-screen bg-[#0a0b0d] px-4 py-8 text-zinc-100 md:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300 hover:text-white">← Dashboard</Link>
        <ConnectWallet />
      </header>
      <section className="mx-auto mt-10 max-w-7xl">
        <h1 className="font-serif text-5xl text-white">Markets</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">Browse initialized StructuredYield pools and open a new PT/YT position.</p>
        <div className="mt-8 grid gap-4">
          {DEMO_MARKETS.map((market) => (
            <article key={market.poolId} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111318] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-white">{market.pair}</h2>
                <p className="mt-1 text-sm text-zinc-500">Maturity {market.maturity} · Volatility {market.volBps} bps · Premium {market.premiumBps} bps · TVL {market.tvl}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPool(market.poolId);
                  setDepositOpen(true);
                }}
                className="min-h-10 rounded-xl bg-[#d4a853] px-5 font-semibold text-[#0a0b0d]"
              >
                Deposit
              </button>
            </article>
          ))}
        </div>
      </section>
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} poolId={selectedPool} />
    </main>
  );
}
