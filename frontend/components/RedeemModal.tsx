"use client";

import { X } from "lucide-react";
import { useRedeemPT } from "@/hooks/useRedeemPT";
import { usePosition } from "@/hooks/usePositions";
import { formatCurrency, formatDuration } from "@/lib/math";

type Props = {
  open: boolean;
  onClose: () => void;
  poolId: `0x${string}`;
};

export function RedeemModal({ open, onClose, poolId }: Props) {
  const { data: position } = usePosition(poolId);
  const { redeem, isLoading, isSuccess, error } = useRedeemPT();
  const matured = position.secondsToMaturity === 0n;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Redeem PT-LP</h2>
            <p className="mt-1 text-sm text-zinc-500">Burn PT/YT and settle principal plus eligible IL coverage.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/10" aria-label="Close redeem dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-6 grid gap-3 text-sm">
          <Row label="PT-LP balance" value={formatCurrency(position.ptBalance)} />
          <Row label="YT-LP to burn" value={formatCurrency(position.ytBalance)} />
          <Row label="IL covered" value={formatCurrency(position.currentILAmount)} />
          <Row label="Maturity" value={formatDuration(position.secondsToMaturity)} />
        </dl>

        {!matured ? (
          <p className="mt-5 rounded-lg border border-[#d4a853]/25 bg-[#d4a853]/10 p-3 text-sm text-[#d4a853]">
            Not matured yet. Redemption unlocks in {formatDuration(position.secondsToMaturity)}.
          </p>
        ) : null}

        {error ? <p className="mt-4 text-sm text-[#f87171]">Redemption failed. Confirm wallet/network and try again.</p> : null}
        {isSuccess ? <p className="mt-4 text-sm text-[#4ade80]">Position closed. Principal and fees settled.</p> : null}

        <button
          type="button"
          disabled={!matured || isLoading}
          onClick={() => redeem(poolId)}
          className="mt-6 min-h-11 w-full rounded-xl bg-[#d4a853] px-4 font-semibold text-[#0a0b0d] transition hover:bg-[#f0c878] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Redeeming..." : matured ? "Confirm Redemption" : `Matures in ${formatDuration(position.secondsToMaturity)}`}
        </button>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-100">{value}</dd>
    </div>
  );
}
