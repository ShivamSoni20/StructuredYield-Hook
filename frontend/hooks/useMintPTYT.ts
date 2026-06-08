"use client";

import { useState } from "react";
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
import { parseDepositAmount } from "@/lib/math";

export function useMintPTYT() {
  const [lastMaturityDays, setLastMaturityDays] = useState(90);
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function deposit(amount: string, poolId: `0x${string}` = DEFAULT_POOL_ID, maturityDays = 90) {
    const selectedMaturityDays = Math.max(1, maturityDays);
    setLastMaturityDays(selectedMaturityDays);
    const depositValue = parseDepositAmount(amount);

    if (USE_REAL_V4) {
      writeContract({
        ...SY_ROUTER,
        functionName: "addLiquidityToPool",
        args: [REAL_POOL_KEY, DEFAULT_TICK_LOWER, DEFAULT_TICK_UPPER, DEFAULT_LIQUIDITY_DELTA, depositValue, DEFAULT_SQRT_PRICE]
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
