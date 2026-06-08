// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

contract InitializeV4Pool is Script {
    using PoolIdLibrary for PoolKey;

    address public constant POOL_MANAGER = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
    uint24 public constant FEE = 3_000;
    int24 public constant TICK_SPACING = 60;

    function run() external returns (bytes32 poolId) {
        address hookAddress = vm.envAddress("V4_HOOK_ADDRESS");
        PoolKey memory key = _poolKey(hookAddress);
        PoolId id = key.toId();

        console2.log("PoolManager:", POOL_MANAGER);
        console2.log("V4 hook:", hookAddress);
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(id));

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        IPoolManager(POOL_MANAGER).initialize(key, TickMath.getSqrtPriceAtTick(0));
        vm.stopBroadcast();

        poolId = PoolId.unwrap(id);
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
