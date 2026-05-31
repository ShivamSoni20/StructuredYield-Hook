// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {InsuranceVault} from "../../src/vault/InsuranceVault.sol";

contract InsuranceVaultTest is Test {
    address private hook = address(0xBEEF);
    address private lp = address(0xCAFE);
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    InsuranceVault private vault;

    function setUp() public {
        vault = new InsuranceVault(hook);
    }

    function testHookCanFundAndPayout() public {
        vm.startPrank(hook);
        vault.fund(poolId, 100 ether);

        uint256 paid = vault.payout(poolId, lp, 40 ether);

        assertEq(paid, 40 ether);
        assertEq(vault.reserves(poolId), 60 ether);
        assertEq(vault.totalPaid(poolId), 40 ether);
        vm.stopPrank();
    }

    function testPayoutIsCappedByReserve() public {
        vm.startPrank(hook);
        vault.fund(poolId, 25 ether);

        uint256 paid = vault.payout(poolId, lp, 100 ether);

        assertEq(paid, 25 ether);
        assertEq(vault.reserves(poolId), 0);
        vm.stopPrank();
    }

    function testNonHookCannotFund() public {
        vm.expectRevert();
        vault.fund(poolId, 1 ether);
    }
}

