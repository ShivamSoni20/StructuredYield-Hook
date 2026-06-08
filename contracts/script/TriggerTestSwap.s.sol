// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {SYRouter} from "../src/periphery/SYRouter.sol";

contract TriggerTestSwap is Script {
    using PoolIdLibrary for PoolKey;

    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
    uint24 public constant FEE = 3_000;
    int24 public constant TICK_SPACING = 60;

    function run() external {
        address hookAddress = vm.envAddress("V4_HOOK_ADDRESS");
        address routerAddress = vm.envAddress("SY_ROUTER");
        uint128 amountIn = uint128(vm.envOr("SWAP_AMOUNT_IN", uint256(1e15)));
        bool zeroForOne = vm.envOr("ZERO_FOR_ONE", true);

        PoolKey memory key = _poolKey(hookAddress);
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(key.toId()));

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        SYRouter(payable(routerAddress)).swapExactInputSingle(
            key,
            zeroForOne,
            amountIn,
            zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1,
            0
        );
        vm.stopBroadcast();

        console2.log("Swap submitted through SYRouter; PoolManager afterSwap should fire.");
    }

    function _poolKey(address hookAddress) internal pure returns (PoolKey memory key) {
        (address token0, address token1) = WETH < USDC ? (WETH, USDC) : (USDC, WETH);
        key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(hookAddress)
        });
    }
}
