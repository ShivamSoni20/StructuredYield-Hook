"use client";

import { useAccount, useReadContract } from "wagmi";
import { DEFAULT_POOL_ID, DEFAULT_SQRT_PRICE, SY_LENS } from "@/lib/contracts";
import { DEMO_POSITIONS } from "@/lib/demo";

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

export const mockPosition: PositionView = DEMO_POSITIONS[0];

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
    data: (query.data as PositionView | undefined) ?? DEMO_POSITIONS.find((position) => position.poolId === poolId) ?? mockPosition,
    isMocked: !query.data
  };
}

export function usePositions() {
  return {
    data: DEMO_POSITIONS,
    isLoading: false,
    isMocked: true
  };
}
