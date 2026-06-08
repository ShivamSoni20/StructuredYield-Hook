"use client";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DEFAULT_SQRT_PRICE, REAL_POOL_KEY, SY_ROUTER } from "@/lib/contracts";

const MIN_SQRT_PRICE_PLUS_ONE = 4295128740n;
const MAX_SQRT_PRICE_MINUS_ONE = 1461446703485210103287273052203988822378723970341n;

export function useRealV4Swap() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function swapExactInput(amountIn: bigint, zeroForOne = true) {
    writeContract({
      ...SY_ROUTER,
      functionName: "swapExactInputSingle",
      args: [
        REAL_POOL_KEY,
        zeroForOne,
        amountIn,
        zeroForOne ? MIN_SQRT_PRICE_PLUS_ONE : MAX_SQRT_PRICE_MINUS_ONE,
        DEFAULT_SQRT_PRICE
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
