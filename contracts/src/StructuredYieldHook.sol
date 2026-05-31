// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PTToken} from "./tokens/PTToken.sol";
import {YTToken} from "./tokens/YTToken.sol";

contract StructuredYieldHook {
    struct PoolConfig {
        uint256 maturityTimestamp;
        address ptToken;
        address ytToken;
        uint256 insuranceReserve;
        uint256 feeBuffer;
        bool initialized;
    }

    struct LPPosition {
        uint256 depositedValue;
        uint160 referenceSqrtPrice;
        uint256 ptMinted;
        uint256 ytMinted;
        uint256 depositTimestamp;
        bool active;
    }

    mapping(bytes32 => PoolConfig) public pools;
    mapping(bytes32 => mapping(address => LPPosition)) public positions;

    event PoolInitialized(bytes32 indexed poolId, address ptToken, address ytToken, uint256 maturity);
    event PTYTMinted(bytes32 indexed poolId, address indexed lp, uint256 ptAmount, uint256 ytAmount, uint256 maturity);
    event PositionClosed(bytes32 indexed poolId, address indexed lp, uint256 principal, uint256 totalFees);

    error PoolAlreadyInitialized();
    error PoolNotInitialized();
    error InvalidMaturity();
    error InvalidDepositValue();
    error PositionNotActive();
    error PositionMatured();
    error PositionNotMatured();

    function initializePool(bytes32 poolId, uint256 maturityTimestamp) external returns (address ptToken, address ytToken) {
        if (pools[poolId].initialized) revert PoolAlreadyInitialized();
        if (maturityTimestamp <= block.timestamp) revert InvalidMaturity();

        PTToken pt = new PTToken(address(this));
        YTToken yt = new YTToken(address(this));

        ptToken = address(pt);
        ytToken = address(yt);

        pools[poolId] = PoolConfig({
            maturityTimestamp: maturityTimestamp,
            ptToken: ptToken,
            ytToken: ytToken,
            insuranceReserve: 0,
            feeBuffer: 0,
            initialized: true
        });

        emit PoolInitialized(poolId, ptToken, ytToken, maturityTimestamp);
    }

    function beforeAddLiquidity(
        bytes32 poolId,
        address lp,
        uint256 depositValue,
        uint160 referenceSqrtPrice
    ) external returns (bytes4) {
        PoolConfig memory pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();
        if (depositValue == 0) revert InvalidDepositValue();
        if (block.timestamp >= pool.maturityTimestamp) revert PositionMatured();

        uint256 ytAmount = _computeYTAmount(depositValue, pool.maturityTimestamp);

        positions[poolId][lp] = LPPosition({
            depositedValue: depositValue,
            referenceSqrtPrice: referenceSqrtPrice,
            ptMinted: depositValue,
            ytMinted: ytAmount,
            depositTimestamp: block.timestamp,
            active: true
        });

        PTToken(pool.ptToken).mint(lp, depositValue);
        YTToken(pool.ytToken).mint(lp, ytAmount);

        emit PTYTMinted(poolId, lp, depositValue, ytAmount, pool.maturityTimestamp);

        return this.beforeAddLiquidity.selector;
    }

    function afterRemoveLiquidity(bytes32 poolId, address lp) external returns (bytes4) {
        PoolConfig memory pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        LPPosition memory position = positions[poolId][lp];
        if (!position.active) revert PositionNotActive();
        if (block.timestamp < pool.maturityTimestamp) revert PositionNotMatured();

        delete positions[poolId][lp];

        PTToken(pool.ptToken).burn(lp, position.ptMinted);
        YTToken(pool.ytToken).burn(lp, position.ytMinted);

        emit PositionClosed(poolId, lp, position.ptMinted, 0);

        return this.afterRemoveLiquidity.selector;
    }

    function _computeYTAmount(uint256 depositValue, uint256 maturityTimestamp) internal view returns (uint256) {
        uint256 secondsToMaturity = maturityTimestamp - block.timestamp;
        return (depositValue * secondsToMaturity) / 365 days;
    }
}

