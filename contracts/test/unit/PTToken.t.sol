// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {PTToken} from "../../src/tokens/PTToken.sol";

contract PTTokenTest is Test {
    address private hook = address(0xBEEF);
    address private lp = address(0xCAFE);
    PTToken private token;

    function setUp() public {
        token = new PTToken(hook);
    }

    function testHookCanMintAndBurn() public {
        vm.startPrank(hook);
        token.mint(lp, 100 ether);
        assertEq(token.balanceOf(lp), 100 ether);
        assertEq(token.totalSupply(), 100 ether);

        token.burn(lp, 40 ether);
        assertEq(token.balanceOf(lp), 60 ether);
        assertEq(token.totalSupply(), 60 ether);
        vm.stopPrank();
    }

    function testNonHookCannotMint() public {
        vm.expectRevert();
        token.mint(lp, 1 ether);
    }

    function testNonHookCannotBurn() public {
        vm.prank(hook);
        token.mint(lp, 1 ether);

        vm.expectRevert();
        token.burn(lp, 1 ether);
    }
}

