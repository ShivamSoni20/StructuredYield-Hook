"use client";

import { useReadContract } from "wagmi";
import { DEFAULT_POOL_ID, INSURANCE_VAULT } from "@/lib/contracts";

const vaultDeployed = INSURANCE_VAULT.address !== "0x0000000000000000000000000000000000000000";

export function useVaultState(poolId: `0x${string}` = DEFAULT_POOL_ID) {
  const accountingReserve = useReadContract({
    ...INSURANCE_VAULT,
    functionName: "reserves",
    args: [poolId],
    query: { enabled: vaultDeployed, refetchInterval: 30_000, staleTime: 15_000 }
  });

  const realBacking = useReadContract({
    ...INSURANCE_VAULT,
    functionName: "realSolvency",
    args: [poolId],
    query: { enabled: vaultDeployed, refetchInterval: 30_000, staleTime: 15_000 }
  });

  const tokenReserves = useReadContract({
    ...INSURANCE_VAULT,
    functionName: "tokenReserves",
    args: [poolId],
    query: { enabled: vaultDeployed, refetchInterval: 30_000, staleTime: 15_000 }
  });

  return {
    accountingReserve: (accountingReserve.data as bigint | undefined) ?? 0n,
    realBacking: (realBacking.data as bigint | undefined) ?? 0n,
    tokenReserves: (tokenReserves.data as bigint | undefined) ?? 0n,
    isLoading: accountingReserve.isLoading || realBacking.isLoading || tokenReserves.isLoading,
    isMocked: !vaultDeployed
  };
}
