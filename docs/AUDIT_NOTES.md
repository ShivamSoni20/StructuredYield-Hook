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
| Access control | Partial | Token mint/burn, vault funding/payout, and fee accounting are hook-only. Hook admin/config functions are currently unrestricted for demo speed. |
| Reentrancy | Needs final review | No external token transfers in vault yet, but production token custody will need a guard. |
| Arithmetic | Partial | Solidity 0.8 checked arithmetic is used. Fixed-point math should be fuzzed before production. |
| Oracle assumptions | Good | IL math uses reference/current sqrt price inputs; no external oracle dependency in current model. |
| Solvency | Partial | Vault caps payout by reserve; no reserve target enforcement yet. |
| Token custody | Not in scope | Current scaffold accounts value but does not custody underlying LP tokens. |
| Uniswap V4 integration | Partial | `StructuredYieldV4Hook` implements the installed `IHooks` callback surface directly; final PoolManager settlement tests remain. |

## Known Risks

1. `initializePool`, `fundInsuranceReserve`, and `updateVolatility` are unrestricted. Add ownership or pool manager validation before testnet.
2. `beforeRemoveLiquidity` can be called before maturity and can trigger coverage before `afterRemoveLiquidity`. Production should gate coverage according to withdrawal policy.
3. `YieldAccounting.claimFees` uses current YT balance input from the hook position, not live token balance. If YT becomes transferable/tradable, fee ownership must follow token balances or snapshots.
4. `ILMath` should be fuzzed for extreme sqrt price ratios and overflow boundaries.
5. `SYLens` is for frontend convenience and should not be used as a source of truth for settlement.

## Tooling Status

- Slither: ran locally with `slither . --exclude-dependencies`; no Critical/High findings, but medium/info findings remain for reentrancy review, timestamp usage, divide-before-multiply, unused returns, and zero-address validation.
- Foundry tests: `forge test -vvv` passes with 30 tests.
- Gas snapshot: `forge snapshot` passes and writes `contracts/.gas-snapshot`.
- Frontend build: runs with `npm.cmd run build`.

## Pre-Testnet Remediation

- Add `Ownable` or explicit deployer/admin controls.
- Keep the direct `IHooks` adapter or switch to `BaseHook` if a future `v4-periphery` release exposes it.
- Add fork tests against the target V4 deployment.
- Add fuzz tests for IL math and accounting.
- Resolve remaining Slither medium/info findings before real testnet custody.
- Compare `forge snapshot` values against final production gas targets.
