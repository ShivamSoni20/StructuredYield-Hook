// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {StructuredYieldHook} from "../src/StructuredYieldHook.sol";
import {SYLens} from "../src/periphery/SYLens.sol";
import {SYRouter} from "../src/periphery/SYRouter.sol";

contract Deploy is Script {
    address public constant UNICHAIN_SEPOLIA_POOL_MANAGER = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC;

    function run() external returns (StructuredYieldHook hook, SYRouter router, SYLens lens) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        bool scaffoldMode = vm.envOr("SCAFFOLD_MODE", true);
        address existingHook = vm.envOr("STRUCTURED_YIELD_HOOK", address(0));

        vm.startBroadcast(deployerPrivateKey);

        hook = existingHook == address(0) ? new StructuredYieldHook() : StructuredYieldHook(existingHook);
        router = new SYRouter(hook, IPoolManager(UNICHAIN_SEPOLIA_POOL_MANAGER), scaffoldMode);
        lens = new SYLens(hook);

        console2.log("StructuredYieldHook:", address(hook));
        console2.log("SYRouter:", address(router));
        console2.log("SYLens:", address(lens));
        console2.log("PoolManager:", UNICHAIN_SEPOLIA_POOL_MANAGER);
        console2.log("Scaffold mode:", scaffoldMode);

        vm.stopBroadcast();
    }
}
