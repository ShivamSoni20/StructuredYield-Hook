import type { PositionView } from "@/hooks/usePositions";

export type DemoPosition = PositionView & {
  poolId: `0x${string}`;
  poolName: string;
  maturityDate: string;
  feeApy: number;
};

export const DEMO_POSITIONS: DemoPosition[] = [
  {
    poolId: "0x1111111111111111111111111111111111111111111111111111111111111111",
    poolName: "ETH / USDC",
    ptBalance: 50_000n * 10n ** 18n,
    ytBalance: 12_328n * 10n ** 18n,
    depositedValue: 50_000n * 10n ** 18n,
    currentILBps: 137n,
    currentILAmount: 685n * 10n ** 18n,
    accruedFees: 1_203n * 10n ** 18n,
    secondsToMaturity: 38n * 86_400n,
    isVaultSolvent: true,
    estimatedFixedAPY: 840n,
    active: true,
    maturityDate: "Jul 15, 2026",
    feeApy: 23.1
  },
  {
    poolId: "0x2222222222222222222222222222222222222222222222222222222222222222",
    poolName: "wBTC / USDC",
    ptBalance: 37_430n * 10n ** 18n,
    ytBalance: 9_214n * 10n ** 18n,
    depositedValue: 37_430n * 10n ** 18n,
    currentILBps: 310n,
    currentILAmount: 1_160n * 10n ** 18n,
    accruedFees: 1_891n * 10n ** 18n,
    secondsToMaturity: 61n * 86_400n,
    isVaultSolvent: false,
    estimatedFixedAPY: 980n,
    active: true,
    maturityDate: "Aug 01, 2026",
    feeApy: 19.7
  },
  {
    poolId: "0x3333333333333333333333333333333333333333333333333333333333333333",
    poolName: "wstETH / USDC",
    ptBalance: 40_000n * 10n ** 18n,
    ytBalance: 7_440n * 10n ** 18n,
    depositedValue: 40_000n * 10n ** 18n,
    currentILBps: 91n,
    currentILAmount: 360n * 10n ** 18n,
    accruedFees: 747n * 10n ** 18n,
    secondsToMaturity: 92n * 86_400n,
    isVaultSolvent: true,
    estimatedFixedAPY: 710n,
    active: true,
    maturityDate: "Sep 01, 2026",
    feeApy: 16.4
  }
];

export const DEMO_FEE_HISTORY = [
  { month: "Jan", value: 1_200 },
  { month: "Feb", value: 980 },
  { month: "Mar", value: 1_540 },
  { month: "Apr", value: 2_100 },
  { month: "May", value: 1_760 },
  { month: "Jun", value: 2_480 }
];

export const DEMO_MARKETS = [
  { poolId: DEMO_POSITIONS[0].poolId, pair: "ETH / USDC", maturity: "90 days", volBps: 920, premiumBps: 84, tvl: "$50,000" },
  { poolId: DEMO_POSITIONS[1].poolId, pair: "wBTC / USDC", maturity: "90 days", volBps: 1_140, premiumBps: 98, tvl: "$37,430" },
  { poolId: DEMO_POSITIONS[2].poolId, pair: "wstETH / USDC", maturity: "180 days", volBps: 760, premiumBps: 71, tvl: "$40,000" }
];
