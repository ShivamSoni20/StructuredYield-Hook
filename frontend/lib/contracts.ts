const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const DEFAULT_POOL_ID = (process.env.NEXT_PUBLIC_REAL_POOL_ID ||
  "0x92b0899e642ee283b7673bfb931c1e44bb7c2a00c18cc1862d11d743dd8849e4") as `0x${string}`;
export const DEFAULT_SQRT_PRICE = 79228162514264337593543950336n;
export const DEFAULT_LIQUIDITY_DELTA = 1_000_000n;
export const DEFAULT_TICK_LOWER = -887220;
export const DEFAULT_TICK_UPPER = 887220;
export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
export const V4_HOOK_ADDRESS = (process.env.NEXT_PUBLIC_V4_HOOK_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
export const USE_REAL_V4 = V4_HOOK_ADDRESS !== ZERO_ADDRESS;

export const REAL_POOL_KEY = {
  currency0: "0x31d0220469e10c4E71834a79b1f276d740d3768F" as `0x${string}`,
  currency1: "0x4200000000000000000000000000000000000006" as `0x${string}`,
  fee: 3000,
  tickSpacing: 60,
  hooks: V4_HOOK_ADDRESS
} as const;

const poolKeyComponents = [
  { name: "currency0", type: "address" },
  { name: "currency1", type: "address" },
  { name: "fee", type: "uint24" },
  { name: "tickSpacing", type: "int24" },
  { name: "hooks", type: "address" }
] as const;

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
  address: (process.env.NEXT_PUBLIC_SY_ROUTER || ZERO_ADDRESS) as `0x${string}`,
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
    },
    {
      type: "function",
      name: "addLiquidityToPool",
      stateMutability: "payable",
      inputs: [
        { name: "key", type: "tuple", components: poolKeyComponents },
        { name: "tickLower", type: "int24" },
        { name: "tickUpper", type: "int24" },
        { name: "liquidity", type: "uint128" },
        { name: "depositValue", type: "uint256" },
        { name: "referenceSqrtPrice", type: "uint160" }
      ],
      outputs: [{ name: "delta", type: "int256" }]
    },
    {
      type: "function",
      name: "removeLiquidityFromPool",
      stateMutability: "payable",
      inputs: [
        { name: "key", type: "tuple", components: poolKeyComponents },
        { name: "tickLower", type: "int24" },
        { name: "tickUpper", type: "int24" },
        { name: "liquidity", type: "uint128" },
        { name: "currentSqrtPrice", type: "uint160" }
      ],
      outputs: [{ name: "delta", type: "int256" }]
    },
    {
      type: "function",
      name: "swapExactInputSingle",
      stateMutability: "payable",
      inputs: [
        { name: "key", type: "tuple", components: poolKeyComponents },
        { name: "zeroForOne", type: "bool" },
        { name: "amountIn", type: "uint128" },
        { name: "sqrtPriceLimitX96", type: "uint160" },
        { name: "currentSqrtPrice", type: "uint160" }
      ],
      outputs: [{ name: "delta", type: "int256" }]
    }
  ]
} as const;

export const V4_POOL_MANAGER = {
  address: "0x00B036B58a818B1BC34d502D3fE730Db729e62AC" as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "initialize",
      stateMutability: "nonpayable",
      inputs: [
        { name: "key", type: "tuple", components: poolKeyComponents },
        { name: "sqrtPriceX96", type: "uint160" }
      ],
      outputs: [{ name: "tick", type: "int24" }]
    }
  ]
} as const;

export const V4_STATE_VIEW = {
  address: "0xc199F1072a74D4e905ABa1A84d9a45E2546B6222" as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "getSlot0",
      stateMutability: "view",
      inputs: [{ name: "poolId", type: "bytes32" }],
      outputs: [
        { name: "sqrtPriceX96", type: "uint160" },
        { name: "tick", type: "int24" },
        { name: "protocolFee", type: "uint24" },
        { name: "lpFee", type: "uint24" }
      ]
    },
    {
      type: "function",
      name: "getLiquidity",
      stateMutability: "view",
      inputs: [{ name: "poolId", type: "bytes32" }],
      outputs: [{ name: "liquidity", type: "uint128" }]
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
