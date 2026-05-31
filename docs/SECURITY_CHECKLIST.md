# Security Checklist

## Before Testnet

- [ ] Install Foundry.
- [ ] Install Slither.
- [ ] Pull Uniswap V4 core/periphery dependencies.
- [ ] Convert callback-like functions to real `BaseHook` overrides.
- [ ] Add access control for pool initialization, volatility updates, and reserve funding.
- [ ] Add maturity and withdrawal policy checks around IL coverage.
- [ ] Add deployment scripts and deterministic hook address validation.
- [ ] Run unit tests.
- [ ] Run integration tests.
- [ ] Run fork tests.
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
- Accounting correctness when YT tokens transfer.
- Solvency under extreme IL scenarios.
- Fee index precision and rounding behavior.
- Reentrancy once underlying asset transfers are added.
- Correct Uniswap V4 hook permissions and callback selectors.

