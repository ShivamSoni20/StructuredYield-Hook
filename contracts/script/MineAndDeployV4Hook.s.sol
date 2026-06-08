// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {StructuredYieldV4Hook} from "../src/StructuredYieldV4Hook.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

contract MineAndDeployV4Hook is Script {
    address public constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external returns (address hookAddress) {
        uint160 flags = _hookFlags();

        (address predictedAddress, bytes32 salt) =
            HookMiner.find(CREATE2_DEPLOYER, flags, type(StructuredYieldV4Hook).creationCode, "");

        console2.log("Mined hook address:", predictedAddress);
        console2.log("Salt:");
        console2.logBytes32(salt);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        StructuredYieldV4Hook hook = new StructuredYieldV4Hook{salt: salt}();
        require(address(hook) == predictedAddress, "Address mismatch");
        vm.stopBroadcast();

        console2.log("Deployed V4 hook:", address(hook));
        hookAddress = address(hook);
    }

    function mineOnly() external view returns (address predictedAddress, bytes32 salt) {
        return HookMiner.find(CREATE2_DEPLOYER, _hookFlags(), type(StructuredYieldV4Hook).creationCode, "");
    }

    function _hookFlags() internal pure returns (uint160) {
        return uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG
                | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_SWAP_FLAG
        );
    }
}
