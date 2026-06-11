# Audit Notes

## Scope

Reviewed source areas:

- `contracts/src/StructuredYieldHook.sol`
- `contracts/src/tokens/*`
- `contracts/src/math/*`
- `contracts/src/accounting/YieldAccounting.sol`
- `contracts/src/vault/InsuranceVault.sol`
- `contracts/src/periphery/*`

## Security Checklist

| Area | Status | Notes |
|---|---|---|
| Access control | Improved | Token mint/burn, vault accounting/payout, and fee accounting are hook-only. `updateVolatility` is owner-gated; pool initialization is constrained to owner/self/Unichain V4 PoolManager with maturity bounds. |
| Reentrancy | Improved | Real vault payouts use ERC-20 transfers behind a non-reentrant guard. Full Slither/fork review is still required before mainnet custody. |
| Arithmetic | Partial | Solidity 0.8 checked arithmetic is used. Fixed-point math should be fuzzed before production. |
| Oracle assumptions | Good | IL math uses reference/current sqrt price inputs; no external oracle dependency in current model. |
| Solvency | Improved | Vault caps payout by both accounting reserve and real USDC backing; no reserve target enforcement yet. |
| Token custody | Testnet-ready | `InsuranceVault.fundWithTokens` custodies real USDC and `payout` transfers real backing to LPs; deployed demo addresses need redeploy/funding for this path. |
| Uniswap V4 integration | Testnet live | `StructuredYieldV4Hook` is deployed on Unichain Sepolia; real PoolManager liquidity and swap settlement have been tested. |

## Known Risks

1. `initializePool` is now guarded for owner/self/Unichain V4 PoolManager and bounded maturity windows. Keep reviewing deployment admin assumptions before mainnet.
2. `beforeRemoveLiquidity` is maturity-gated, so IL payout only happens at or after maturity in the current scaffold.
3. YT transfers are intentionally disabled in V1 so fee ownership remains deterministic. If YT becomes transferable/tradable later, fee ownership must follow token balances or snapshots.
4. `ILMath` should be fuzzed for extreme sqrt price ratios and overflow boundaries.
5. `SYLens` is for frontend convenience and should not be used as a source of truth for settlement.
6. `InsuranceVault.reserves(poolId)` remains the accounting liability ledger, while `tokenReserves(poolId)` and `realSolvency(poolId, liability)` expose real USDC backing.
7. `SYLens.getPosition()` now reports pending claimable YT fees from the fee index. Historical claimed fees remain available from the core position state/events rather than that lens field.

## Tooling Status

- Slither: ran locally with `slither . --exclude-dependencies`; no Critical/High findings, but medium/info findings remain for reentrancy review, timestamp usage, divide-before-multiply, unused returns, and zero-address validation.
- Foundry tests: `forge test` passes with 40 tests.
- Gas snapshot: `forge snapshot` passes and writes `contracts/.gas-snapshot`.
- Frontend build: runs with `npm.cmd run build`.

## Pre-Testnet Remediation

- Redeploy latest contracts and fund the live vault with Unichain Sepolia USDC before final demo judging.
- Keep the CREATE2-mined `StructuredYieldV4Hook` deployment address permission bits aligned with `getHookPermissions()`.
- Keep the direct `IHooks` adapter or switch to `BaseHook` if a future `v4-periphery` release exposes it.
- Keep fork tests against the target V4 deployment in CI before production releases.
- Add fuzz tests for IL math and accounting.
- Resolve remaining Slither medium/info findings before mainnet custody.
- Compare `forge snapshot` values against final production gas targets.
