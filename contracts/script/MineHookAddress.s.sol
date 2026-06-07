// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

contract MineHookAddress is Script {
    function run() external pure {
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
                | Hooks.AFTER_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        console2.log("StructuredYieldV4Hook required permission flags:");
        console2.logUint(flags);
        console2.log("Mine a CREATE2 salt so uint160(hookAddress) & Hooks.ALL_HOOK_MASK == flags.");
        console2.log("Example:");
        console2.log("forge create src/StructuredYieldV4Hook.sol:StructuredYieldV4Hook --create2-salt <SALT>");
    }
}
