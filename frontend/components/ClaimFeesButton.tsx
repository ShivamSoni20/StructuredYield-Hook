"use client";

import { useClaimFees } from "@/hooks/useClaimFees";
import { usePosition } from "@/hooks/usePositions";
import { formatCurrency } from "@/lib/math";

export function ClaimFeesButton({ poolId }: { poolId: `0x${string}` }) {
  const { data: position } = usePosition(poolId);
  const { claim, isLoading, isSuccess } = useClaimFees();
  const noFees = position.accruedFees === 0n;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={noFees || isLoading}
        onClick={() => claim(poolId)}
        className="min-h-11 w-full rounded-xl bg-[#2dd4bf] px-4 font-semibold text-[#06120f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {noFees ? "No fees to claim" : isLoading ? "Claiming..." : `Claim ${formatCurrency(position.accruedFees)}`}
      </button>
      {isSuccess ? <p className="text-center text-xs text-[#4ade80]">Fees claimed successfully.</p> : null}
    </div>
  );
}
