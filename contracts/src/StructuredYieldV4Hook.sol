// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {StructuredYieldHook} from "./StructuredYieldHook.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

contract StructuredYieldV4Hook is StructuredYieldHook, IHooks {
    using PoolIdLibrary for PoolKey;

    uint256 public constant DEFAULT_MATURITY_DURATION = 90 days;

    function getHookPermissions() public pure returns (Hooks.Permissions memory permissions) {
        permissions = Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: true,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata key, uint160, int24) external returns (bytes4) {
        this.initializePool(_poolId(key), block.timestamp + DEFAULT_MATURITY_DURATION);
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external returns (bytes4) {
        (address lp, uint256 depositValue, uint160 referenceSqrtPrice) =
            _decodeLiquidityHookData(sender, params, hookData);
        _callCore(abi.encodeWithSelector(StructuredYieldHook.beforeAddLiquidity.selector, _poolId(key), lp, depositValue, referenceSqrtPrice));
        return IHooks.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDeltaLibrary.ZERO_DELTA);
    }

    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata hookData
    ) external returns (bytes4) {
        (address lp, uint160 currentSqrtPrice) = _decodeRemovalHookData(sender, hookData);
        this.beforeRemoveLiquidity(_poolId(key), lp, currentSqrtPrice);
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata hookData
    ) external returns (bytes4, BalanceDelta) {
        address lp = hookData.length >= 32 ? abi.decode(hookData, (address)) : sender;
        this.afterRemoveLiquidity(_poolId(key), lp);
        return (IHooks.afterRemoveLiquidity.selector, BalanceDeltaLibrary.ZERO_DELTA);
    }

    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        pure
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata,
        BalanceDelta delta,
        bytes calldata hookData
    ) external returns (bytes4, int128) {
        uint160 currentSqrtPrice = hookData.length >= 32 ? abi.decode(hookData, (uint160)) : 0;
        uint256 feeAmount = _absoluteDeltaValue(delta);
        _callCore(abi.encodeWithSelector(AFTER_SWAP_SELECTOR, _poolId(key), feeAmount, currentSqrtPrice));
        return (IHooks.afterSwap.selector, 0);
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IHooks.afterDonate.selector;
    }

    function _decodeLiquidityHookData(
        address sender,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) internal pure returns (address lp, uint256 depositValue, uint160 referenceSqrtPrice) {
        if (hookData.length >= 96) return abi.decode(hookData, (address, uint256, uint160));

        lp = sender;
        depositValue = params.liquidityDelta > 0 ? uint256(params.liquidityDelta) : 0;
        referenceSqrtPrice = 0;
    }

    function _decodeRemovalHookData(address sender, bytes calldata hookData)
        internal
        pure
        returns (address lp, uint160 currentSqrtPrice)
    {
        if (hookData.length >= 64) return abi.decode(hookData, (address, uint160));

        lp = sender;
        currentSqrtPrice = hookData.length >= 32 ? abi.decode(hookData, (uint160)) : 0;
    }

    function _absoluteDeltaValue(BalanceDelta delta) internal pure returns (uint256 value) {
        int128 amount0 = BalanceDeltaLibrary.amount0(delta);
        int128 amount1 = BalanceDeltaLibrary.amount1(delta);

        value = _abs(amount0) + _abs(amount1);
    }

    function _abs(int128 amount) internal pure returns (uint256) {
        return amount < 0 ? uint256(uint128(-amount)) : uint256(uint128(amount));
    }

    function _poolId(PoolKey calldata key) internal pure returns (bytes32) {
        PoolId poolId = key.toId();
        return PoolId.unwrap(poolId);
    }

    function _callCore(bytes memory data) internal {
        (bool success, bytes memory returnData) = address(this).call(data);
        if (!success) {
            assembly ("memory-safe") {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }
    }
}
