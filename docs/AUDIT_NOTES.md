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
| Access control | Partial | Token mint/burn, vault funding/payout, and fee accounting are hook-only. `updateVolatility` is owner-gated; pool initialization remains open for demo/testnet setup. |
| Reentrancy | Needs final review | No external token transfers in vault yet, but production token custody will need a guard. |
| Arithmetic | Partial | Solidity 0.8 checked arithmetic is used. Fixed-point math should be fuzzed before production. |
| Oracle assumptions | Good | IL math uses reference/current sqrt price inputs; no external oracle dependency in current model. |
| Solvency | Partial | Vault caps payout by reserve; no reserve target enforcement yet. |
| Token custody | Not in scope | Current scaffold accounts value but does not custody underlying LP tokens or real vault assets. |
| Uniswap V4 integration | Partial | `StructuredYieldV4Hook` implements the installed `IHooks` callback surface directly; final PoolManager settlement tests remain. |

## Known Risks

1. `initializePool` and `fundInsuranceReserve` remain dependency-light scaffold entry points. Add PoolManager/owner validation before real custody.
2. `beforeRemoveLiquidity` is maturity-gated, so IL payout only happens at or after maturity in the current scaffold.
3. `YieldAccounting.claimFees` uses current YT balance input from the hook position, not live token balance. If YT becomes transferable/tradable, fee ownership must follow token balances or snapshots.
4. `ILMath` should be fuzzed for extreme sqrt price ratios and overflow boundaries.
5. `SYLens` is for frontend convenience and should not be used as a source of truth for settlement.
6. `InsuranceVault.reserves(poolId)` is an accounting ledger for the scaffold. It does not transfer or custody USDC/WETH/ETH yet; production `fund()` and `payout()` must move real assets and add reentrancy protection.

## Tooling Status

- Slither: ran locally with `slither . --exclude-dependencies`; no Critical/High findings, but medium/info findings remain for reentrancy review, timestamp usage, divide-before-multiply, unused returns, and zero-address validation.
- Foundry tests: `forge test -vvv` passes with 30 tests.
- Gas snapshot: `forge snapshot` passes and writes `contracts/.gas-snapshot`.
- Frontend build: runs with `npm.cmd run build`.

## Pre-Testnet Remediation

- Add explicit deployer/admin controls for remaining scaffold setup functions.
- Add real token custody to `InsuranceVault.fund()` and `InsuranceVault.payout()` before production deployment.
- Mine/deploy `StructuredYieldV4Hook` with CREATE2 so the address permission bits match `getHookPermissions()`.
- Keep the direct `IHooks` adapter or switch to `BaseHook` if a future `v4-periphery` release exposes it.
- Add fork tests against the target V4 deployment.
- Add fuzz tests for IL math and accounting.
- Resolve remaining Slither medium/info findings before real testnet custody.
- Compare `forge snapshot` values against final production gas targets.
