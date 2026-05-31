// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library PremiumMath {
    uint256 internal constant BPS = 10_000;

    function computePremiumBps(
        uint256 volatilityBps,
        uint256 secondsToMaturity,
        uint256 reserveRatioBps
    ) internal pure returns (uint256 premiumBps) {
        uint256 maturityFactorBps = (secondsToMaturity * BPS) / 365 days;
        uint256 utilizationSurchargeBps = reserveRatioBps < 2_000 ? 500 : 0;

        premiumBps = 50 + ((volatilityBps * maturityFactorBps) / BPS) + utilizationSurchargeBps;

        if (premiumBps > 3_000) return 3_000;
    }
}

