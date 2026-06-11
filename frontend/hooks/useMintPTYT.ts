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

const Q96 = 2n ** 96n;

export function computeLiquidityDelta(depositValueUsdc: bigint, sqrtPriceX96: bigint) {
  if (depositValueUsdc === 0n || sqrtPriceX96 === 0n) return 1_000_000n;

  const normalizedAmount = depositValueUsdc * 10n ** 12n;
  const rawLiquidity = (normalizedAmount * sqrtPriceX96) / Q96;
  const MIN_LIQUIDITY = 1_000_000n;
  const MAX_LIQUIDITY = 1_000_000_000_000_000n;

  if (rawLiquidity < MIN_LIQUIDITY) return MIN_LIQUIDITY;
  if (rawLiquidity > MAX_LIQUIDITY) return MAX_LIQUIDITY;
  return rawLiquidity;
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
      const liveSqrtPrice = slot0.data?.[0] ?? DEFAULT_SQRT_PRICE;
      const liquidityDelta = computeLiquidityDelta(depositValue, liveSqrtPrice);
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
