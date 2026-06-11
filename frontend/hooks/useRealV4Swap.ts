"use client";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DEFAULT_SQRT_PRICE, REAL_POOL_KEY, SY_ROUTER } from "@/lib/contracts";
import { usePoolState } from "@/hooks/usePoolState";

const SLIPPAGE_BPS = 200n;
const BPS = 10_000n;
const MIN_SQRT_PRICE = 4295128739n;
const MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342n;

function getSqrtPriceLimit(currentSqrtPrice: bigint, zeroForOne: boolean) {
  if (zeroForOne) {
    const limit = (currentSqrtPrice * (BPS - SLIPPAGE_BPS)) / BPS;
    return limit < MIN_SQRT_PRICE ? MIN_SQRT_PRICE + 1n : limit;
  }

  const limit = (currentSqrtPrice * (BPS + SLIPPAGE_BPS)) / BPS;
  return limit > MAX_SQRT_PRICE ? MAX_SQRT_PRICE - 1n : limit;
}

export function useRealV4Swap() {
  const { slot0 } = usePoolState();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function swapExactInput(amountIn: bigint, zeroForOne = true) {
    const liveSqrtPrice = slot0.data?.[0] ?? DEFAULT_SQRT_PRICE;
    const sqrtPriceLimit = getSqrtPriceLimit(liveSqrtPrice, zeroForOne);
    writeContract({
      ...SY_ROUTER,
      functionName: "swapExactInputSingle",
      args: [
        REAL_POOL_KEY,
        zeroForOne,
        amountIn,
        sqrtPriceLimit,
        liveSqrtPrice
      ]
    });
  }

  return {
    swapExactInput,
    error,
    hash,
    isLoading: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess
  };
}
