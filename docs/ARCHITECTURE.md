# StructuredYield Architecture

StructuredYield splits Uniswap V4 LP exposure into principal and yield claims. The current repository uses a dependency-light contract model so product mechanics can be tested before final `BaseHook` integration.

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
InsuranceVault -> per-pool reserve ledger
YieldAccounting -> cumulative fee index for YT holders
ILMath / PremiumMath -> pure pricing helpers
```

## Contract Responsibilities

- `StructuredYieldHook`: pool setup, LP position lifecycle, fee routing, IL quote/coverage, maturity settlement.
- `PTToken`: hook-only mint/burn token for principal claims.
- `YTToken`: hook-only mint/burn token for fee-stream claims.
- `InsuranceVault`: caps payouts by available per-pool reserve.
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
7. Vault pays up to available reserve.
8. At maturity, PT/YT balances burn and final fees settle.

## Current Integration Boundary

The hook contract currently exposes mockable callback-like functions instead of importing Uniswap V4 packages. Final production work is to adapt these entrypoints to `BaseHook` signatures and `PoolKey`/`PoolId` types.

