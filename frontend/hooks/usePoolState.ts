"use client";

import { encodeAbiParameters, keccak256 } from "viem";
import { useReadContract } from "wagmi";
import { DEFAULT_POOL_ID, REAL_POOL_KEY, V4_STATE_VIEW } from "@/lib/contracts";

const poolKeyAbi = [
  {
    type: "tuple",
    components: [
      { name: "currency0", type: "address" },
      { name: "currency1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
      { name: "hooks", type: "address" }
    ]
  }
] as const;

export function computePoolId(key = REAL_POOL_KEY): `0x${string}` {
  return keccak256(encodeAbiParameters(poolKeyAbi, [key]));
}

const configuredPoolId = (process.env.NEXT_PUBLIC_REAL_POOL_ID || DEFAULT_POOL_ID) as `0x${string}`;

export function usePoolState(poolId: `0x${string}` = configuredPoolId) {
  const slot0 = useReadContract({
    ...V4_STATE_VIEW,
    functionName: "getSlot0",
    args: [poolId]
  });

  const liquidity = useReadContract({
    ...V4_STATE_VIEW,
    functionName: "getLiquidity",
    args: [poolId]
  });

  return {
    poolId,
    computedPoolId: computePoolId(),
    slot0,
    liquidity
  };
}
