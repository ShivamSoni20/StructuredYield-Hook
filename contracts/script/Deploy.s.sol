// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {StructuredYieldHook} from "../src/StructuredYieldHook.sol";
import {SYLens} from "../src/periphery/SYLens.sol";
import {SYRouter} from "../src/periphery/SYRouter.sol";

contract Deploy is Script {
    function run() external returns (StructuredYieldHook hook, SYRouter router, SYLens lens) {
        vm.startBroadcast();

        hook = new StructuredYieldHook();
        router = new SYRouter(hook);
        lens = new SYLens(hook);

        vm.stopBroadcast();
    }
}

