# Security Checklist

## Completed For Current Testnet Demo

- [x] Install Foundry.
- [x] Pull Uniswap V4 core/periphery dependencies.
- [x] Convert callback-like functions to real `IHooks` adapter entrypoints.
- [x] Add deployment scripts and deterministic hook address validation.
- [x] Add guarded pool initialization and maturity bounds.
- [x] Add real USDC vault custody and non-reentrant payout path.
- [x] Disable YT transfers to keep fee ownership deterministic.
- [x] Run unit tests.
- [x] Run integration tests.
- [x] Run fork tests.

## Remaining Before Production/Mainnet

- [ ] Install Slither.
- [x] Add access control for pool initialization, volatility updates, and reserve funding.
- [x] Add maturity and withdrawal policy checks around IL coverage.
- [x] Add real token custody and reentrancy protection for `InsuranceVault`.
- [ ] Add exact V4 liquidity/value quoting and add-liquidity min-out checks.
- [x] Add YT transfer fee-ownership handling or explicitly constrain YT transferability.
- [ ] Run Slither and resolve High/Critical findings.
- [ ] Run gas snapshots and compare against targets.

## Slither Command

```bash
cd contracts
slither .
```

## Foundry Commands

```bash
cd contracts
forge test -vvv
forge snapshot
```

## Review Focus

- Access control on all privileged actions.
- Accounting correctness if YT transferability is reintroduced.
- Solvency under extreme IL scenarios.
- Fee index precision and rounding behavior.
- Reentrancy around vault ERC-20 custody and payout paths.
- Correct Uniswap V4 hook permissions and callback selectors.
