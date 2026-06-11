# StructuredYield Architecture

StructuredYield splits Uniswap V4 LP exposure into principal and yield claims. The repository keeps a dependency-light accounting core and now includes a real Uniswap V4 `IHooks` adapter for deployed PoolManager flows.

## Core Components

```text
LP
 | deposit value + reference sqrtPrice
 v
SYRouter -> StructuredYieldHook
              |-- deploys PTToken / YTToken per pool
              |-- records LPPosition
              |-- mints PT-LP and YT-LP
              |-- routes swap fees
              |-- quotes and covers IL
              `-- settles maturity redemption

SYLens -> aggregates position state for frontend
InsuranceVault -> per-pool accounting reserve plus real USDC backing
YieldAccounting -> cumulative fee index for YT holders
ILMath / PremiumMath -> pure pricing helpers
```

## Contract Responsibilities

- `StructuredYieldHook`: pool setup, LP position lifecycle, fee routing, IL quote/coverage, maturity settlement.
- `PTToken`: hook-only mint/burn token for principal claims.
- `YTToken`: hook-only mint/burn token for fee-stream claims; transfers are disabled in V1 to keep fee ownership deterministic.
- `InsuranceVault`: accepts real USDC funding, tracks per-pool accounting reserves, and caps payouts by both reserve and token backing.
- `YieldAccounting`: tracks cumulative fees per YT token and LP claim snapshots.
- `SYRouter`: UX-facing entrypoint for deposit, claim, and redeem flows.
- `SYLens`: frontend read aggregator for balances, IL, maturity, APY, and solvency.

## Data Flow

1. Pool initialized with maturity.
2. Hook deploys PT/YT token pair.
3. LP deposits through router.
4. Hook records reference sqrt price and mints PT/YT.
5. Swap fees are routed between YT accounting and insurance reserve.
6. Withdrawal quotes terminal IL from reference/current sqrt price.
7. Vault pays up to the lesser of requested IL, accounting reserve, and real USDC backing.
8. At maturity, PT/YT balances burn and final fees settle.

## Current Integration Boundary

`StructuredYieldHook` remains the independently testable accounting core. `StructuredYieldV4Hook` implements the Uniswap V4 `IHooks` callback surface, maps `PoolKey` to `PoolId`, and dispatches accounting through inherited core methods. `SYRouter` supports both the scaffold direct-call mode and the real V4 `PoolManager.unlock` paths for modify-liquidity and swap settlement.

Production hardening still required before mainnet includes exact V4 token-delta liquidity math, deployed subgraph indexing, add-liquidity min-out checks, broader fuzz/invariant coverage, and a fresh Slither pass after redeploy.
