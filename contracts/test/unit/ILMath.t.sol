// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {ILMath} from "../../src/math/ILMath.sol";

contract ILMathTest is Test {
    uint160 private constant ONE_TO_ONE_SQRT_PRICE = 79228162514264337593543950336;

    function testNoILWhenPriceUnchanged() public pure {
        uint256 ilBps = ILMath.computeILBps(ONE_TO_ONE_SQRT_PRICE, ONE_TO_ONE_SQRT_PRICE);
        assertEq(ilBps, 0);
    }

    function testComputesILForFourXPriceMove() public pure {
        uint256 ilBps = ILMath.computeILBps(ONE_TO_ONE_SQRT_PRICE, ONE_TO_ONE_SQRT_PRICE * 2);
        assertEq(ilBps, 2_000);
    }

    function testQuotesILAmount() public pure {
        (uint256 ilAmount, uint256 ilBps) = ILMath.quoteILAmount(
            10_000 ether,
            ONE_TO_ONE_SQRT_PRICE,
            ONE_TO_ONE_SQRT_PRICE * 2
        );

        assertEq(ilBps, 2_000);
        assertEq(ilAmount, 2_000 ether);
    }
}

