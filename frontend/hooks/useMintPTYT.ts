"use client";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DEFAULT_POOL_ID, DEFAULT_SQRT_PRICE, SY_ROUTER } from "@/lib/contracts";
import { parseDepositAmount } from "@/lib/math";

export function useMintPTYT() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  function deposit(amount: string, poolId: `0x${string}` = DEFAULT_POOL_ID) {
    writeContract({
      ...SY_ROUTER,
      functionName: "depositAndMint",
      args: [poolId, parseDepositAmount(amount), DEFAULT_SQRT_PRICE]
    });
  }

  return {
    deposit,
    error,
    hash,
    isLoading: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess
  };
}

