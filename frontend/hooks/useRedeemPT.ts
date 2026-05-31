"use client";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DEFAULT_POOL_ID, DEFAULT_SQRT_PRICE, SY_ROUTER } from "@/lib/contracts";

export function useRedeemPT() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function redeem(poolId: `0x${string}` = DEFAULT_POOL_ID) {
    writeContract({
      ...SY_ROUTER,
      functionName: "removeAndRedeem",
      args: [poolId, DEFAULT_SQRT_PRICE]
    });
  }

  return {
    redeem,
    error,
    hash,
    isLoading: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess
  };
}

