// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {StructuredYieldHook} from "../src/StructuredYieldHook.sol";
import {SYLens} from "../src/periphery/SYLens.sol";
import {SYRouter} from "../src/periphery/SYRouter.sol";

contract Deploy is Script {
    function run() external returns (StructuredYieldHook hook, SYRouter router, SYLens lens) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        hook = new StructuredYieldHook();
        router = new SYRouter(hook, true);
        lens = new SYLens(hook);

        vm.stopBroadcast();
    }
}
