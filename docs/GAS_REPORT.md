# Gas Report

## Targets

| Function | Target Gas | Current Status |
|---|---:|---|
| `beforeAddLiquidity` | < 80,000 | Pending `forge snapshot` |
| `afterSwap` | < 35,000 | Pending `forge snapshot` |
| `beforeRemoveLiquidity` | < 60,000 | Pending `forge snapshot` |
| `afterRemoveLiquidity` | < 45,000 | Pending `forge snapshot` |

## Local Tooling Status

`forge snapshot` could not be run in the current environment because Foundry is not installed.

## Command

Run after installing Foundry:

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

