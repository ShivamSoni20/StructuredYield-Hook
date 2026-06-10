"use client";

import { useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  DEFAULT_POOL_ID,
  DEFAULT_SQRT_PRICE,
  DEFAULT_TICK_LOWER,
  DEFAULT_TICK_UPPER,
  REAL_POOL_KEY,
  SY_ROUTER,
  USE_REAL_V4
} from "@/lib/contracts";
import { parseDepositAmount } from "@/lib/math";
import { usePoolState } from "@/hooks/usePoolState";

export function computeLiquidityDelta(depositValue: bigint) {
  return depositValue > 0n ? depositValue : 1_000_000n;
}

export function useMintPTYT() {
  const [lastMaturityDays, setLastMaturityDays] = useState(90);
  const { slot0 } = usePoolState();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function deposit(amount: string, poolId: `0x${string}` = DEFAULT_POOL_ID, maturityDays = 90) {
    const selectedMaturityDays = Math.max(1, maturityDays);
    setLastMaturityDays(selectedMaturityDays);
    const depositValue = parseDepositAmount(amount, USE_REAL_V4 ? 6 : 18);

    if (USE_REAL_V4) {
      const liquidityDelta = computeLiquidityDelta(depositValue);
      const liveSqrtPrice = slot0.data?.[0] ?? DEFAULT_SQRT_PRICE;
      writeContract({
        ...SY_ROUTER,
        functionName: "addLiquidityToPool",
        args: [REAL_POOL_KEY, DEFAULT_TICK_LOWER, DEFAULT_TICK_UPPER, liquidityDelta, depositValue, liveSqrtPrice]
      });
      return;
    }

    writeContract({ ...SY_ROUTER, functionName: "depositAndMint", args: [poolId, depositValue, DEFAULT_SQRT_PRICE] });
  }

  return {
    deposit,
    error,
    hash,
    isLoading: isPending || receipt.isLoading,
    lastMaturityDays,
    isSuccess: receipt.isSuccess
  };
}
