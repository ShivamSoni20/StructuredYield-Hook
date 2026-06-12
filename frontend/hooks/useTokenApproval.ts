"use client";

import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERC20, SY_ROUTER } from "@/lib/contracts";

export function useTokenApproval(token: `0x${string}`, amount: bigint) {
  const { address, isConnected } = useAccount();
  const allowance = useReadContract({
    address: token,
    abi: ERC20.abi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", SY_ROUTER.address],
    query: {
      enabled: isConnected && amount > 0n,
      refetchInterval: 15_000
    }
  });
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const approved = ((allowance.data as bigint | undefined) ?? 0n) >= (amount * 100n);

  function approve() {
    writeContract({
      address: token,
      abi: ERC20.abi,
      functionName: "approve",
      args: [SY_ROUTER.address, 115792089237316195423570985008687907853269984665640564039457584007913129639935n] // maxUint256
    });
  }

  return {
    approve,
    approved,
    allowance: (allowance.data as bigint | undefined) ?? 0n,
    error,
    hash,
    isLoading: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess
  };
}
