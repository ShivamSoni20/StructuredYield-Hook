// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {StructuredYieldHook} from "../StructuredYieldHook.sol";

contract SYRouter {
    StructuredYieldHook public immutable hook;

    event DepositAndMint(
        bytes32 indexed poolId,
        address indexed lp,
        uint256 depositValue,
        uint160 referenceSqrtPrice
    );

    event RemoveAndRedeem(
        bytes32 indexed poolId,
        address indexed lp,
        uint160 currentSqrtPrice
    );

    constructor(StructuredYieldHook hook_) {
        hook = hook_;
    }

    function initializePool(bytes32 poolId, uint256 maturityTimestamp)
        external
        returns (address ptToken, address ytToken)
    {
        return hook.initializePool(poolId, maturityTimestamp);
    }

    function depositAndMint(
        bytes32 poolId,
        uint256 depositValue,
        uint160 referenceSqrtPrice
    ) external returns (bytes4 selector) {
        selector = hook.beforeAddLiquidity(poolId, msg.sender, depositValue, referenceSqrtPrice);

        emit DepositAndMint(poolId, msg.sender, depositValue, referenceSqrtPrice);
    }

    function removeAndRedeem(bytes32 poolId, uint160 currentSqrtPrice) external returns (bytes4 selector) {
        hook.beforeRemoveLiquidity(poolId, msg.sender, currentSqrtPrice);
        selector = hook.afterRemoveLiquidity(poolId, msg.sender);

        emit RemoveAndRedeem(poolId, msg.sender, currentSqrtPrice);
    }

    function claimFees(bytes32 poolId) external returns (uint256 claimedFees) {
        return hook.claimFees(poolId, msg.sender);
    }
}

