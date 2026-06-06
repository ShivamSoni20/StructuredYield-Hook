// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {StructuredYieldHook} from "../StructuredYieldHook.sol";

contract SYRouter {
    StructuredYieldHook public immutable hook;
    bool public immutable isScaffoldMode;

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

    error ProductionPoolManagerRequired();

    constructor(StructuredYieldHook hook_, bool isScaffoldMode_) {
        hook = hook_;
        isScaffoldMode = isScaffoldMode_;
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
        if (!isScaffoldMode) revert ProductionPoolManagerRequired();
        // TODO: Replace this dependency-light scaffold path with PoolManager.modifyLiquidity for live V4 deployments.
        selector = hook.beforeAddLiquidity(poolId, msg.sender, depositValue, referenceSqrtPrice);

        emit DepositAndMint(poolId, msg.sender, depositValue, referenceSqrtPrice);
    }

    function removeAndRedeem(bytes32 poolId, uint160 currentSqrtPrice) external returns (bytes4 selector) {
        if (!isScaffoldMode) revert ProductionPoolManagerRequired();
        // TODO: Replace these direct hook calls with PoolManager settlement flows for live V4 deployments.
        hook.beforeRemoveLiquidity(poolId, msg.sender, currentSqrtPrice);
        selector = hook.afterRemoveLiquidity(poolId, msg.sender);

        emit RemoveAndRedeem(poolId, msg.sender, currentSqrtPrice);
    }

    function claimFees(bytes32 poolId) external returns (uint256 claimedFees) {
        return hook.claimFees(poolId, msg.sender);
    }
}
