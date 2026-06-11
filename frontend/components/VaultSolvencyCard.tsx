"use client";

import { useVaultState } from "@/hooks/useVaultState";
import { DEFAULT_POOL_ID } from "@/lib/contracts";
import { formatCurrency } from "@/lib/math";

type Props = {
  poolId?: `0x${string}`;
  liability: bigint;
  isSolvent: boolean;
};

export function VaultSolvencyCard({ poolId = DEFAULT_POOL_ID, liability, isSolvent }: Props) {
  const vault = useVaultState(poolId);
  const displayReserve = vault.isMocked ? liability * 2n : vault.accountingReserve;
  const displayRealBacking = vault.isMocked ? 0n : vault.realBacking;
  const displaySolvent = vault.isMocked ? isSolvent : vault.realBacking >= liability;
  const coverage = liability === 0n ? 100 : Math.min(100, Math.round((Number(displayReserve) / Number(liability)) * 100));
  const realCoverage = liability === 0n ? 100 : Math.min(100, Math.round((Number(displayRealBacking) / Number(liability)) * 100));

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">Insurance Vault Status</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {vault.isMocked ? "Estimated from position data" : "Live from InsuranceVault contract"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${displaySolvent ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#f87171]/10 text-[#f87171]"}`}>
          {displaySolvent ? "Solvent" : "Underfunded"}
        </span>
      </div>

      <dl className="mt-6 grid gap-3 text-sm">
        <Row label="Accounting reserve" value={formatCurrency(displayReserve, 6)} />
        <Row label="Real USDC backing" value={formatCurrency(displayRealBacking, 6)} />
        <Row label="Current IL liability" value={formatCurrency(liability)} />
        <Row label="Accounting coverage" value={`${coverage}%`} />
        {!vault.isMocked ? (
          <Row label="Real coverage" value={`${realCoverage}%`} valueClass={realCoverage >= 100 ? "text-[#4ade80]" : "text-[#f87171]"} />
        ) : null}
      </dl>

      {!vault.isMocked && vault.realBacking < liability && liability > 0n ? (
        <p className="mt-4 rounded-lg border border-[#d4a853]/25 bg-[#d4a853]/10 p-3 text-xs text-[#d4a853]">
          Vault accounting reserve: {formatCurrency(displayReserve, 6)}. Real USDC backing: {formatCurrency(displayRealBacking, 6)}. IL coverage is partial; fundWithTokens() can add backing.
        </p>
      ) : null}
    </section>
  );
}

function Row({ label, value, valueClass = "text-zinc-100" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`font-mono ${valueClass}`}>{value}</dd>
    </div>
  );
}
