// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {InsuranceVault} from "../../src/vault/InsuranceVault.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract InsuranceVaultTest is Test {
    address private hook = address(0xBEEF);
    address private lp = address(0xCAFE);
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    InsuranceVault private vault;
    MockERC20 private token;

    function setUp() public {
        token = new MockERC20();
        vault = new InsuranceVault(hook, address(token));
    }

    function testHookCanFundAndPayout() public {
        token.mint(address(this), 100 ether);
        token.approve(address(vault), 100 ether);
        vault.fundWithTokens(poolId, 100 ether);

        vm.prank(hook);
        uint256 paid = vault.payout(poolId, lp, 40 ether);

        assertEq(paid, 40 ether);
        assertEq(vault.reserves(poolId), 60 ether);
        assertEq(vault.totalPaid(poolId), 40 ether);
        assertEq(token.balanceOf(lp), 40 ether);
    }

    function testPayoutIsCappedByReserve() public {
        token.mint(address(this), 25 ether);
        token.approve(address(vault), 25 ether);
        vault.fundWithTokens(poolId, 25 ether);

        vm.prank(hook);
        uint256 paid = vault.payout(poolId, lp, 100 ether);

        assertEq(paid, 25 ether);
        assertEq(vault.reserves(poolId), 0);
        assertEq(token.balanceOf(lp), 25 ether);
    }

    function testPayoutZeroWhenNoTokenBacking() public {
        vm.prank(hook);
        vault.fund(poolId, 100 ether);

        vm.prank(hook);
        uint256 paid = vault.payout(poolId, lp, 50 ether);

        assertEq(paid, 0);
        assertEq(vault.reserves(poolId), 100 ether);
        assertEq(token.balanceOf(lp), 0);
    }

    function testNonHookCannotFund() public {
        vm.expectRevert();
        vault.fund(poolId, 1 ether);
    }

    function testIsSolventChecksRealTokens() public {
        vm.prank(hook);
        vault.fund(poolId, 100 ether);

        assertFalse(vault.isSolvent(poolId, 1 ether));

        token.mint(address(this), 100 ether);
        token.approve(address(vault), 100 ether);
        vault.fundWithTokens(poolId, 100 ether);

        assertTrue(vault.isSolvent(poolId, 50 ether));
        assertFalse(vault.isSolvent(poolId, 150 ether));
    }
}
