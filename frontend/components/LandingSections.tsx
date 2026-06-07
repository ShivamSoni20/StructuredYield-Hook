"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles, Split, WalletCards, Zap } from "lucide-react";
import { PTYTSplitVisual } from "@/components/PTYTSplitVisual";

const stats = [
  ["$58B", "Pendle proof of yield demand"],
  ["60%", "V3 LPs historically unprofitable"],
  ["$60M", "Estimated LP deficit opportunity"],
  ["0", "External oracles required"]
];

const mechanisms = [
  ["PT-LP: Fixed Income", "Principal Tokens represent deposited capital and redeem 1:1 at maturity."],
  ["YT-LP: Fee Stream", "Yield Tokens capture the swap-fee stream until maturity and can be priced independently."],
  ["IL Insurance Vault", "Per-pool reserves cover impermanent loss beyond the fee buffer for PT holders."],
  ["Dynamic Premium", "Volatility, time to maturity, and reserve ratios drive premium quotes."]
];

const hooks = [
  "beforeAddLiquidity",
  "afterSwap",
  "beforeRemoveLiquidity",
  "afterRemoveLiquidity",
  "donate() primitive",
  "transient storage"
];

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 md:grid-cols-[1fr_440px] md:px-8 md:pb-24">
      <div className="flex flex-col justify-center">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#d4a853]/30 bg-[#d4a853]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#d4a853]">
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
          Uniswap V4 Hook · UHI9 Hookathon
        </div>
        <h1 className="font-serif text-5xl leading-tight tracking-tight text-white md:text-7xl">
          Fixed Income for <em className="text-[#d4a853]">Every</em> LP
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
          StructuredYield splits Uniswap V4 LP positions into PT-LP principal tokens and YT-LP fee-stream tokens, creating predictable returns while yield seekers trade fee exposure.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="min-h-12 rounded-xl bg-[#d4a853] px-6 font-semibold text-[#0a0b0d] transition hover:bg-[#f0c878]"
          >
            Launch App →
          </button>
          <a
            href="#how"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            How it works
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#111318] p-6 shadow-2xl shadow-black/30">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Demo Position</p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-sm text-zinc-400">ETH / USDC</p>
            <p className="font-mono text-3xl text-white">$50,000</p>
          </div>
          <span className="rounded-full bg-[#4ade80]/10 px-3 py-1 text-xs font-semibold text-[#4ade80]">Insurance Active</span>
        </div>
        <div className="mt-8">
          <PTYTSplitVisual pt={50_000n * 10n ** 18n} yt={14_200n * 10n ** 18n} />
        </div>
        <dl className="mt-6 grid gap-3 text-sm">
          <DemoRow label="Fixed APY" value="8.4%" />
          <DemoRow label="Variable yield" value="23.1%" />
          <DemoRow label="Maturity" value="Jul 15, 2026" />
        </dl>
      </div>
    </section>
  );
}

export function StatsRow() {
  return (
    <section className="mx-auto grid max-w-5xl gap-4 border-y border-white/10 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
      {stats.map(([value, label]) => (
        <div key={label} className="text-center">
          <p className="font-serif text-4xl text-white">{value}</p>
          <p className="mt-2 text-sm text-zinc-500">{label}</p>
        </div>
      ))}
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <SectionHeading eyebrow="How It Works" title="Pendle-style yield splitting, native to Uniswap V4" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <InfoCard icon={<WalletCards />} title="Deposit liquidity" body="Choose a supported pool and maturity. The hook records reference price and deposit value." />
        <InfoCard icon={<Split />} title="Hook mints PT + YT" body="beforeAddLiquidity mints PT-LP principal and YT-LP fee-stream tokens atomically." />
        <InfoCard icon={<ShieldCheck />} title="Claim fixed return" body="At maturity, PT redeems principal while the vault covers eligible IL." />
      </div>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-[#111318] p-5">
        <div className="flex min-w-[720px] items-center justify-between gap-3 text-center text-sm">
          {["LP Deposit", "beforeAddLiquidity", "PT-LP + YT-LP", "afterSwap fees", "Maturity"].map((step, index) => (
            <div key={step} className="flex flex-1 items-center gap-3">
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-semibold text-zinc-200">{step}</div>
              {index < 4 ? <span className="text-[#d4a853]">→</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MechanismSection() {
  return (
    <section id="mechanism" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <SectionHeading eyebrow="Mechanism" title="Four interlocking systems" />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {mechanisms.map(([title, body]) => <InfoCard key={title} icon={<Sparkles />} title={title} body={body} />)}
      </div>
    </section>
  );
}

export function HookPoints() {
  return (
    <section id="hooks" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <SectionHeading eyebrow="Hook Points" title="V4 callbacks powering the lifecycle" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hooks.map((hook) => (
          <div key={hook} className="rounded-xl border border-white/10 bg-[#111318] p-4 font-mono text-sm text-[#2dd4bf]">
            {hook}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CTASection() {
  const router = useRouter();
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h2 className="font-serif text-4xl text-white md:text-5xl">Ready to earn fixed LP returns?</h2>
      <p className="mt-4 text-zinc-400">Deploy the hook, choose a maturity, and let StructuredYield handle PT/YT accounting.</p>
      <button type="button" onClick={() => router.push("/dashboard")} className="mt-8 min-h-12 rounded-xl bg-[#d4a853] px-8 font-semibold text-[#0a0b0d]">
        Open Dashboard →
      </button>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4a853]">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-white md:text-5xl">{title}</h2>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a853]/10 text-[#d4a853]">{icon}</div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
    </article>
  );
}

function DemoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-white/10 pt-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-100">{value}</dd>
    </div>
  );
}
