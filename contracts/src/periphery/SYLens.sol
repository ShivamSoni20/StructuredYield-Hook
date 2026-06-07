// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {StructuredYieldHook} from "../StructuredYieldHook.sol";
import {PTToken} from "../tokens/PTToken.sol";
import {YTToken} from "../tokens/YTToken.sol";

contract SYLens {
    StructuredYieldHook public immutable hook;

    struct PositionView {
        uint256 ptBalance;
        uint256 ytBalance;
        uint256 depositedValue;
        uint256 currentILBps;
        uint256 currentILAmount;
        uint256 accruedFees;
        uint256 secondsToMaturity;
        bool isVaultSolvent;
        uint256 estimatedFixedAPY;
        bool active;
    }

    constructor(StructuredYieldHook hook_) {
        hook = hook_;
    }

    function getPosition(bytes32 poolId, address lp, uint160 currentSqrtPrice)
        external
        view
        returns (PositionView memory view_)
    {
        (
            uint256 depositedValue,
            ,
            uint256 ptMinted,
            ,
            uint256 depositTimestamp,
            uint256 ilCovered,
            uint256 feesClaimed,
            bool active
        ) = hook.positions(poolId, lp);

        (
            uint256 maturityTimestamp,
            address ptToken,
            address ytToken,
            uint256 insuranceReserve,
            ,
            ,
            bool initialized
        ) = hook.pools(poolId);

        if (!initialized || !active) return view_;

        (uint256 currentILAmount, uint256 currentILBps) = hook.quoteIL(poolId, lp, currentSqrtPrice);
        uint256 elapsed = block.timestamp > depositTimestamp ? block.timestamp - depositTimestamp : 1;
        uint256 claimedAndCovered = feesClaimed + ilCovered;

        view_ = PositionView({
            ptBalance: PTToken(ptToken).balanceOf(lp),
            ytBalance: YTToken(ytToken).balanceOf(lp),
            depositedValue: depositedValue,
            currentILBps: currentILBps,
            currentILAmount: currentILAmount,
            accruedFees: claimedAndCovered,
            secondsToMaturity: block.timestamp >= maturityTimestamp ? 0 : maturityTimestamp - block.timestamp,
            isVaultSolvent: insuranceReserve >= currentILAmount,
            estimatedFixedAPY: ptMinted == 0 ? 0 : (claimedAndCovered * 365 days * 10_000) / (ptMinted * elapsed),
            active: active
        });
    }

    function getPoolTokens(bytes32 poolId) external view returns (address ptToken, address ytToken) {
        (, ptToken, ytToken,,,,) = hook.pools(poolId);
    }
}
