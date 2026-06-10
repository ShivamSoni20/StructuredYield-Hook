# Uniswap V4 Hook Migration

This repository keeps `StructuredYieldHook` as the dependency-light accounting scaffold and adds `StructuredYieldV4Hook` as the Uniswap V4-facing adapter.

## Required Dependency Install

From `contracts/`:

```bash
forge install Uniswap/v4-core
forge install Uniswap/v4-periphery
forge install OpenZeppelin/openzeppelin-contracts
```

Expected remappings:

```text
@uniswap/v4-core/=lib/v4-core/
@uniswap/v4-periphery/=lib/v4-periphery/
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

## Contract Conversion Status

1. `StructuredYieldHook` remains the independently testable accounting core.
2. `StructuredYieldV4Hook` is the current `IHooks` callback adapter.
3. Callback entrypoints use `PoolKey calldata key` + `key.toId()` for pool identity.
4. `getHookPermissions()` enables:
   - `afterInitialize`
   - `beforeAddLiquidity`
   - `beforeRemoveLiquidity`
   - `afterRemoveLiquidity`
   - `afterSwap`
5. `afterInitialize` initializes PT/YT lifecycle state for the V4 pool id.
6. `beforeAddLiquidity` accepts explicit LP accounting data through `hookData`.
7. `afterSwap` routes deterministic delta-derived fee input into the accounting path.
8. The deployed hook address has the required permission bits on Unichain Sepolia.
9. `SYRouter` calls `PoolManager.unlock`, `modifyLiquidity`, and `swap` for the real V4 path.
10. Remaining mainnet work: replace demo `depositValue`/liquidity sizing with exact V4 token-delta math and slippage-controlled quotes.

## Target Callback Mapping

| Current scaffold method | Final V4 callback |
|---|---|
| `initializePool(bytes32,uint256)` | `afterInitialize(address, PoolKey, uint160, int24, bytes)` |
| `beforeAddLiquidity(bytes32,address,uint256,uint160)` | `beforeAddLiquidity(address, PoolKey, ModifyLiquidityParams, bytes)` |
| `afterSwap(bytes32,uint256,uint160)` | `afterSwap(address, PoolKey, SwapParams, BalanceDelta, bytes)` |
| `beforeRemoveLiquidity(bytes32,address,uint160)` | `beforeRemoveLiquidity(address, PoolKey, ModifyLiquidityParams, bytes)` |
| `afterRemoveLiquidity(bytes32,address)` | `afterRemoveLiquidity(address, PoolKey, ModifyLiquidityParams, BalanceDelta, BalanceDelta, bytes)` |

## Notes

- The installed `v4-periphery` package does not expose a `BaseHook.sol`, so the adapter implements `IHooks` directly.
- Hook deployment must mine or otherwise choose an address with the configured V4 permission bits.
