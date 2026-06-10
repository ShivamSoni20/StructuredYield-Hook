"use client";

import { useAccount, useReadContract } from "wagmi";
import { DEFAULT_POOL_ID, DEFAULT_SQRT_PRICE, SY_LENS } from "@/lib/contracts";
import { DEMO_POSITIONS, type DemoPosition } from "@/lib/demo";
import { usePoolState } from "@/hooks/usePoolState";

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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const lensDeployed = SY_LENS.address !== ZERO_ADDRESS;

function withLiveMetadata(position: PositionView): DemoPosition {
  return {
    ...position,
    poolId: DEFAULT_POOL_ID,
    poolName: "ETH / USDC",
    maturityDate: position.secondsToMaturity === 0n ? "Matured" : "Active",
    feeApy: 23.1
  };
}

export function usePosition(poolId: `0x${string}` = DEFAULT_POOL_ID) {
  const { address, isConnected } = useAccount();
  const { slot0 } = usePoolState(poolId);
  const liveSqrtPrice = slot0.data?.[0] ?? DEFAULT_SQRT_PRICE;
  const query = useReadContract({
    ...SY_LENS,
    functionName: "getPosition",
    args: [poolId, address ?? ZERO_ADDRESS, liveSqrtPrice],
    query: {
      enabled: isConnected && lensDeployed,
      refetchInterval: 30_000,
      staleTime: 15_000
    }
  });
  const liveData = query.data as PositionView | undefined;
  const fallback = DEMO_POSITIONS.find((position) => position.poolId === poolId) ?? mockPosition;

  return {
    ...query,
    data: liveData?.active ? liveData : fallback,
    isMocked: !liveData?.active
  };
}

export function usePositions() {
  const { address, isConnected } = useAccount();
  const { slot0 } = usePoolState();
  const liveSqrtPrice = slot0.data?.[0] ?? DEFAULT_SQRT_PRICE;
  const query = useReadContract({
    ...SY_LENS,
    functionName: "getPosition",
    args: [DEFAULT_POOL_ID, address ?? ZERO_ADDRESS, liveSqrtPrice],
    query: {
      enabled: isConnected && lensDeployed,
      refetchInterval: 30_000,
      staleTime: 15_000
    }
  });
  const livePosition = query.data as PositionView | undefined;
  const livePositions = livePosition?.active ? [withLiveMetadata(livePosition)] : [];

  return {
    data: livePositions.length > 0 ? livePositions : DEMO_POSITIONS,
    isLoading: query.isLoading,
    isMocked: livePositions.length === 0
  };
}
