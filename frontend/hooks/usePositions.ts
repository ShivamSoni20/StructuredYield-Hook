"use client";

import { useAccount, useReadContract } from "wagmi";
import { DEFAULT_POOL_ID, DEFAULT_SQRT_PRICE, SY_LENS } from "@/lib/contracts";

export type PositionView = {
  ptBalance: bigint;
  ytBalance: bigint;
  depositedValue: bigint;
  currentILBps: bigint;
  currentILAmount: bigint;
  accruedFees: bigint;
  secondsToMaturity: bigint;
  isVaultSolvent: boolean;
  estimatedFixedAPY: bigint;
  active: boolean;
};

export const mockPosition: PositionView = {
  ptBalance: 50_000n * 10n ** 18n,
  ytBalance: 12_328n * 10n ** 18n,
  depositedValue: 50_000n * 10n ** 18n,
  currentILBps: 137n,
  currentILAmount: 685n * 10n ** 18n,
  accruedFees: 1_240n * 10n ** 18n,
  secondsToMaturity: 74n * 86_400n,
  isVaultSolvent: true,
  estimatedFixedAPY: 1120n,
  active: true
};

export function usePosition(poolId: `0x${string}` = DEFAULT_POOL_ID) {
  const { address, isConnected } = useAccount();
  const query = useReadContract({
    ...SY_LENS,
    functionName: "getPosition",
    args: [poolId, address ?? "0x0000000000000000000000000000000000000000", DEFAULT_SQRT_PRICE],
    query: {
      enabled: isConnected && SY_LENS.address !== "0x0000000000000000000000000000000000000000"
    }
  });

  return {
    ...query,
    data: (query.data as PositionView | undefined) ?? mockPosition,
    isMocked: !query.data
  };
}

