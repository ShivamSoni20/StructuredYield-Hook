// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {InsuranceVault} from "../src/vault/InsuranceVault.sol";

contract FundVault is Script {
    address public constant USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;

    function run() external {
        address vaultAddress = vm.envAddress("INSURANCE_VAULT");
        bytes32 poolId = vm.envBytes32("POOL_ID");
        uint256 amount = vm.envOr("FUND_AMOUNT_USDC", uint256(10_000_000));

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        IERC20(USDC).approve(vaultAddress, amount);
        InsuranceVault(vaultAddress).fundWithTokens(poolId, amount);

        console2.log("Vault funded with USDC:", amount);
        console2.log("Pool ID:", vm.toString(poolId));
        console2.log("Vault:", vaultAddress);
        console2.log("Real backing:", InsuranceVault(vaultAddress).realSolvency(poolId));

        vm.stopBroadcast();
    }
}
