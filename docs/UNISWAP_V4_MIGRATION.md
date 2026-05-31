# Uniswap V4 BaseHook Migration

This repository currently keeps `StructuredYieldHook` dependency-light so the PT/YT, fee-routing, IL, vault, router, lens, and frontend mechanics can be developed without blocking on external packages.

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

1. Change `StructuredYieldHook` to inherit `BaseHook`.
2. Store `IPoolManager` through the `BaseHook` constructor.
3. Replace `bytes32 poolId` with `PoolKey calldata key` + `key.toId()` where callback entrypoints are used.
4. Implement `getHookPermissions()` with:
   - `afterInitialize`
   - `beforeAddLiquidity`
   - `beforeRemoveLiquidity`
   - `afterRemoveLiquidity`
   - `afterSwap`
5. Move `initializePool` logic into `afterInitialize`.
6. Derive `referenceSqrtPrice` from `poolManager.getSlot0(id)` in `beforeAddLiquidity`.
7. Route swap fees from actual V4 swap deltas in `afterSwap`.
8. Validate deployed hook address has the correct permission bits.
9. Replace demo `depositValue` accounting with real liquidity/value computation.
10. Update `SYRouter` to call PoolManager modify-liquidity flows rather than direct hook methods.

## Target Callback Mapping

| Current scaffold method | Final V4 callback |
|---|---|
| `initializePool(bytes32,uint256)` | `afterInitialize(address, PoolKey, uint160, int24, bytes)` |
| `beforeAddLiquidity(bytes32,address,uint256,uint160)` | `beforeAddLiquidity(address, PoolKey, ModifyLiquidityParams, bytes)` |
| `afterSwap(bytes32,uint256,uint160)` | `afterSwap(address, PoolKey, SwapParams, BalanceDelta, bytes)` |
| `beforeRemoveLiquidity(bytes32,address,uint160)` | `beforeRemoveLiquidity(address, PoolKey, ModifyLiquidityParams, bytes)` |
| `afterRemoveLiquidity(bytes32,address)` | `afterRemoveLiquidity(address, PoolKey, ModifyLiquidityParams, BalanceDelta, BalanceDelta, bytes)` |

## Blocker

The local environment currently does not expose a working `forge` command, so the actual import-based migration cannot be validated here yet.

