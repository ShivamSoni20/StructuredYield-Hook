"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { PositionTable } from "@/components/PositionTable";
import { WalletRouteGuard } from "@/components/WalletRouteGuard";

export default function PositionsPage() {
  return (
    <WalletRouteGuard>
      <main className="min-h-screen bg-[#0a0b0d] px-4 py-8 text-zinc-100 md:px-8">
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <ConnectWallet />
        </header>
        <section className="mx-auto mt-10 max-w-7xl">
          <h1 className="font-serif text-4xl text-white">All Positions</h1>
          <p className="mt-2 text-sm text-zinc-500">Browse active PT-LP and YT-LP positions.</p>
          <div className="mt-8">
            <PositionTable />
          </div>
        </section>
      </main>
    </WalletRouteGuard>
  );
}
