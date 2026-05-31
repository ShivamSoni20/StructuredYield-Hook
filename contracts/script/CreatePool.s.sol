// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {StructuredYieldHook} from "../src/StructuredYieldHook.sol";

contract CreatePool is Script {
    bytes32 public constant DEFAULT_POOL_ID = keccak256("ETH-USDC-3000");
    uint256 public constant DEFAULT_MATURITY_DAYS = 90;

    function run() external returns (address ptToken, address ytToken) {
        address hookAddress = vm.envAddress("STRUCTURED_YIELD_HOOK");
        uint256 maturityDays = vm.envOr("MATURITY_DAYS", DEFAULT_MATURITY_DAYS);
        uint256 maturity = block.timestamp + (maturityDays * 1 days);

        vm.startBroadcast();
        (ptToken, ytToken) = StructuredYieldHook(hookAddress).initializePool(DEFAULT_POOL_ID, maturity);
        vm.stopBroadcast();
    }
}

