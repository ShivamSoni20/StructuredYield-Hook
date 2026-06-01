# Gas Report

## Targets

| Function | Target Gas | Current Status |
|---|---:|---|
| `beforeAddLiquidity` | < 80,000 | Scaffold path covered through deposit tests; production value path still above target because PT/YT minting is included. |
| `afterSwap` | < 35,000 | Scaffold path covered through fee-routing tests; production path still above target because accounting/vault updates are included. |
| `beforeRemoveLiquidity` | < 60,000 | Covered through IL tests; final settlement design should reduce hot-path writes. |
| `afterRemoveLiquidity` | < 45,000 | Covered through redeem tests; production custody/token burn policy should be revisited. |

## Local Tooling Status

`forge snapshot` passes locally with the bundled workspace Foundry binary.

## Snapshot Highlights

| Test | Gas |
|---|---:|
| `FullFlowTest:testDepositSwapMatureRedeemFlow` | 1,324,374 |
| `StructuredYieldHookTest:testAfterSwapRoutesFeesToYTAndInsurance` | 1,496,873 |
| `StructuredYieldHookTest:testBeforeRemoveLiquidityCoversILFromVault` | 1,416,316 |
| `SYRouterTest:testDepositAndMintUsesSenderAsLP` | 1,316,545 |
| `StructuredYieldV4HookTest:testReportsExpectedHookPermissions` | 8,961 |
| `StructuredYieldV4HookTest:testUnusedV4CallbacksReturnSelectorsAndZeroDeltas` | 9,098 |

## Command

Run:

```bash
cd contracts
forge snapshot
```

Recommended focused snapshots:

```bash
forge test --match-contract StructuredYieldHookTest --gas-report
forge test --match-contract SYRouterTest --gas-report
```

## Optimization Notes

- Avoid deploying PT/YT token pairs inside production hook callbacks; deploy during pool initialization only.
- Keep `afterSwap` O(1) by using a cumulative fee index instead of per-holder loops.
- Keep vault payout as reserve ledger accounting until final settlement to avoid token transfer overhead in hot paths.
- Cache pool config reads in memory where values are not mutated.
- Revisit `SYLens` only for read gas; it is not settlement-critical.
