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

## Contract Conversion Checklist

1. Keep `StructuredYieldHook` as the independently testable accounting core.
2. Use `StructuredYieldV4Hook` for the current `IHooks` callback surface.
3. Replace `bytes32 poolId` with `PoolKey calldata key` + `key.toId()` where callback entrypoints are used.
4. `getHookPermissions()` currently enables:
   - `afterInitialize`
   - `beforeAddLiquidity`
   - `beforeRemoveLiquidity`
   - `afterRemoveLiquidity`
   - `afterSwap`
5. `afterInitialize` initializes PT/YT lifecycle state for the V4 pool id.
6. `beforeAddLiquidity` accepts explicit LP accounting data through `hookData`.
7. `afterSwap` routes deterministic delta-derived fee input into the accounting path.
8. Validate deployed hook address has the correct permission bits.
9. Replace demo `depositValue` accounting with real liquidity/value computation before mainnet use.
10. Update `SYRouter` to call PoolManager modify-liquidity flows rather than direct hook methods.

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
