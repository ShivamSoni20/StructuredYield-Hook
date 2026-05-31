// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FixedPointMath} from "./FixedPointMath.sol";

library ILMath {
    uint256 internal constant BPS = 10_000;
    uint256 internal constant Q96 = 2 ** 96;

    function computeILBps(uint160 sqrtPriceRef, uint160 sqrtPriceCurr) internal pure returns (uint256 ilBps) {
        if (sqrtPriceRef == 0 || sqrtPriceCurr == 0) return 0;

        uint256 sqrtK = (uint256(sqrtPriceCurr) * 1e18) / uint256(sqrtPriceRef);
        uint256 k = (sqrtK * sqrtK) / 1e18;
        uint256 numerator = 2 * FixedPointMath.sqrt(k * 1e18);
        uint256 denominator = 1e18 + k;
        uint256 lpValueVsHold = (numerator * 1e18) / denominator;

        if (lpValueVsHold >= 1e18) return 0;
        return ((1e18 - lpValueVsHold) * BPS) / 1e18;
    }

    function quoteILAmount(
        uint256 depositedValue,
        uint160 sqrtPriceRef,
        uint160 sqrtPriceCurr
    ) internal pure returns (uint256 ilAmount, uint256 ilBps) {
        ilBps = computeILBps(sqrtPriceRef, sqrtPriceCurr);
        ilAmount = (depositedValue * ilBps) / BPS;
    }
}

