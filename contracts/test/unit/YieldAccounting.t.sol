// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {YieldAccounting} from "../../src/accounting/YieldAccounting.sol";

contract YieldAccountingTest is Test {
    address private hook = address(0xBEEF);
    address private lp = address(0xCAFE);
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    YieldAccounting private accounting;

    function setUp() public {
        accounting = new YieldAccounting(hook);
    }

    function testAccruesAndClaimsFees() public {
        vm.startPrank(hook);
        accounting.accrueFees(poolId, 50 ether, 100 ether);

        uint256 owed = accounting.claimFees(poolId, lp, 20 ether);

        assertEq(owed, 10 ether);
        assertEq(accounting.claimedFees(poolId, lp), 10 ether);
        vm.stopPrank();
    }

    function testNonHookCannotAccrue() public {
        vm.expectRevert();
        accounting.accrueFees(poolId, 1 ether, 1 ether);
    }
}

