"use client";

import { useClaimFees } from "@/hooks/useClaimFees";
import { usePosition } from "@/hooks/usePositions";
import { formatCurrency } from "@/lib/math";

export function ClaimFeesButton({ poolId }: { poolId: `0x${string}` }) {
  const { data: position, isMocked } = usePosition(poolId);
  const { claim, isLoading, isSuccess } = useClaimFees();
  const noFees = isMocked && position.accruedFees === 0n;
  const liveClaimable = !isMocked && position.ytBalance > 0n;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={(!liveClaimable && noFees) || isLoading}
        onClick={() => claim(poolId)}
        className="min-h-11 w-full rounded-xl bg-[#2dd4bf] px-4 font-semibold text-[#06120f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {noFees ? "No fees to claim" : isLoading ? "Claiming..." : liveClaimable ? "Claim live YT fees" : `Claim ${formatCurrency(position.accruedFees)}`}
      </button>
      {!isMocked ? <p className="text-center text-xs text-zinc-500">Live claim checks the hook fee index at transaction time.</p> : null}
      {isSuccess ? <p className="text-center text-xs text-[#4ade80]">Fees claimed successfully.</p> : null}
    </div>
  );
}
