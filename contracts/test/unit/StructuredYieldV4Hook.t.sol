// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StructuredYieldV4Hook} from "../../src/StructuredYieldV4Hook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {BalanceDelta, toBalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

contract StructuredYieldV4HookTest is Test {
    StructuredYieldV4Hook internal hook;

    function setUp() public {
        hook = new StructuredYieldV4Hook();
    }

    function testReportsExpectedHookPermissions() public view {
        Hooks.Permissions memory permissions = hook.getHookPermissions();

        assertTrue(permissions.afterInitialize);
        assertTrue(permissions.beforeAddLiquidity);
        assertTrue(permissions.beforeRemoveLiquidity);
        assertTrue(permissions.afterRemoveLiquidity);
        assertTrue(permissions.afterSwap);
        assertFalse(permissions.beforeSwap);
        assertFalse(permissions.beforeSwapReturnDelta);
        assertFalse(permissions.afterSwapReturnDelta);
    }

    function testUnusedV4CallbacksReturnSelectorsAndZeroDeltas() public view {
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(address(0x1)),
            currency1: Currency.wrap(address(0x2)),
            fee: 3_000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        IPoolManager.SwapParams memory params =
            IPoolManager.SwapParams({zeroForOne: true, amountSpecified: -1 ether, sqrtPriceLimitX96: 0});

        (bytes4 selector, BeforeSwapDelta beforeSwapDelta, uint24 feeOverride) =
            hook.beforeSwap(address(this), key, params, "");
        assertEq(selector, IHooks.beforeSwap.selector);
        assertEq(BeforeSwapDelta.unwrap(beforeSwapDelta), BeforeSwapDelta.unwrap(BeforeSwapDeltaLibrary.ZERO_DELTA));
        assertEq(feeOverride, 0);

        (bytes4 addSelector, BalanceDelta addDelta) = hook.afterAddLiquidity(
            address(this),
            key,
            IPoolManager.ModifyLiquidityParams({tickLower: -60, tickUpper: 60, liquidityDelta: 1, salt: bytes32(0)}),
            toBalanceDelta(0, 0),
            toBalanceDelta(0, 0),
            ""
        );
        assertEq(addSelector, IHooks.afterAddLiquidity.selector);
        assertEq(BalanceDelta.unwrap(addDelta), BalanceDelta.unwrap(BalanceDeltaLibrary.ZERO_DELTA));
    }
}
