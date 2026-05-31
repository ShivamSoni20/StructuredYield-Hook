// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {YTToken} from "../../src/tokens/YTToken.sol";

contract YTTokenTest is Test {
    address private hook = address(0xBEEF);
    address private lp = address(0xCAFE);
    YTToken private token;

    function setUp() public {
        token = new YTToken(hook);
    }

    function testHookCanMintAndBurn() public {
        vm.startPrank(hook);
        token.mint(lp, 90 ether);
        assertEq(token.balanceOf(lp), 90 ether);
        assertEq(token.totalSupply(), 90 ether);

        token.burn(lp, 30 ether);
        assertEq(token.balanceOf(lp), 60 ether);
        assertEq(token.totalSupply(), 60 ether);
        vm.stopPrank();
    }

    function testNonHookCannotMint() public {
        vm.expectRevert();
        token.mint(lp, 1 ether);
    }
}

