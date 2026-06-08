"use client";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  DEFAULT_LIQUIDITY_DELTA,
  DEFAULT_POOL_ID,
  DEFAULT_SQRT_PRICE,
  DEFAULT_TICK_LOWER,
  DEFAULT_TICK_UPPER,
  REAL_POOL_KEY,
  SY_ROUTER,
  USE_REAL_V4
} from "@/lib/contracts";

export function useRedeemPT() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function redeem(poolId: `0x${string}` = DEFAULT_POOL_ID) {
    if (USE_REAL_V4) {
      writeContract({
        ...SY_ROUTER,
        functionName: "removeLiquidityFromPool",
        args: [REAL_POOL_KEY, DEFAULT_TICK_LOWER, DEFAULT_TICK_UPPER, DEFAULT_LIQUIDITY_DELTA, DEFAULT_SQRT_PRICE]
      });
      return;
    }

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
