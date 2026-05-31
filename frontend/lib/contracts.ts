export const DEFAULT_POOL_ID = "0x1111111111111111111111111111111111111111111111111111111111111111" as const;
export const DEFAULT_SQRT_PRICE = 79228162514264337593543950336n;
export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

export const STRUCTURED_YIELD_HOOK = {
  address: (process.env.NEXT_PUBLIC_STRUCTURED_YIELD_HOOK || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "claimFees",
      stateMutability: "nonpayable",
      inputs: [
        { name: "poolId", type: "bytes32" },
        { name: "lp", type: "address" }
      ],
      outputs: [{ name: "claimedFees", type: "uint256" }]
    },
    {
      type: "function",
      name: "quotePremiumBps",
      stateMutability: "view",
      inputs: [{ name: "poolId", type: "bytes32" }],
      outputs: [{ name: "", type: "uint256" }]
    }
  ]
} as const;

export const SY_ROUTER = {
  address: (process.env.NEXT_PUBLIC_SY_ROUTER || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "depositAndMint",
      stateMutability: "nonpayable",
      inputs: [
        { name: "poolId", type: "bytes32" },
        { name: "depositValue", type: "uint256" },
        { name: "referenceSqrtPrice", type: "uint160" }
      ],
      outputs: [{ name: "selector", type: "bytes4" }]
    },
    {
      type: "function",
      name: "removeAndRedeem",
      stateMutability: "nonpayable",
      inputs: [
        { name: "poolId", type: "bytes32" },
        { name: "currentSqrtPrice", type: "uint160" }
      ],
      outputs: [{ name: "selector", type: "bytes4" }]
    },
    {
      type: "function",
      name: "claimFees",
      stateMutability: "nonpayable",
      inputs: [{ name: "poolId", type: "bytes32" }],
      outputs: [{ name: "claimedFees", type: "uint256" }]
    }
  ]
} as const;

export const SY_LENS = {
  address: (process.env.NEXT_PUBLIC_SY_LENS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "getPosition",
      stateMutability: "view",
      inputs: [
        { name: "poolId", type: "bytes32" },
        { name: "lp", type: "address" },
        { name: "currentSqrtPrice", type: "uint160" }
      ],
      outputs: [
        {
          name: "view_",
          type: "tuple",
          components: [
            { name: "ptBalance", type: "uint256" },
            { name: "ytBalance", type: "uint256" },
            { name: "depositedValue", type: "uint256" },
            { name: "currentILBps", type: "uint256" },
            { name: "currentILAmount", type: "uint256" },
            { name: "accruedFees", type: "uint256" },
            { name: "secondsToMaturity", type: "uint256" },
            { name: "isVaultSolvent", type: "bool" },
            { name: "estimatedFixedAPY", type: "uint256" },
            { name: "active", type: "bool" }
          ]
        }
      ]
    }
  ]
} as const;
