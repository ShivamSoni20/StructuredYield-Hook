"use client";

import { useAccount, useReadContract } from "wagmi";
import { ERC20 } from "@/lib/contracts";

export function useTokenBalance(token: `0x${string}`) {
  const { address, isConnected } = useAccount();
  return useReadContract({
    address: token,
    abi: ERC20.abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: isConnected,
      refetchInterval: 10_000
    }
  });
}
