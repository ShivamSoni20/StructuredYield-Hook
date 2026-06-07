"use client";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DEFAULT_POOL_ID, SY_ROUTER } from "@/lib/contracts";

export function useClaimFees() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function claim(poolId: `0x${string}` = DEFAULT_POOL_ID) {
    writeContract({
      ...SY_ROUTER,
      functionName: "claimFees",
      args: [poolId]
    });
  }

  return {
    claim,
    error,
    hash,
    isLoading: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess
  };
}
