"use client";

import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0b0d]/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white md:text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4a853] font-mono text-sm font-bold text-[#0a0b0d]">
            SY
          </span>
          StructuredYield
        </Link>
        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#how" className="transition hover:text-white">How It Works</a>
          <a href="#mechanism" className="transition hover:text-white">Mechanism</a>
          <a href="#hooks" className="transition hover:text-white">Hook Points</a>
        </div>
        <ConnectWallet redirectOnConnect />
      </nav>
    </header>
  );
}
