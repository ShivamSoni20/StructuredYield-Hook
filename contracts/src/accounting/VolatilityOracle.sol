// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract VolatilityOracle {
    uint256 public constant BPS = 10_000;
    uint256 public constant WINDOW = 50;

    address public immutable hook;

    struct ObservationWindow {
        uint160 lastSqrtPrice;
        uint256 cursor;
        uint256 count;
        uint256 sumAbsDeltaBps;
        uint256[50] deltas;
    }

    mapping(bytes32 => ObservationWindow) private windows;

    event VolatilityUpdated(bytes32 indexed poolId, uint160 sqrtPrice, uint256 volatilityBps);

    error NotHook();

    modifier onlyHook() {
        if (msg.sender != hook) revert NotHook();
        _;
    }

    constructor(address hook_) {
        hook = hook_;
    }

    function observe(bytes32 poolId, uint160 sqrtPrice) external onlyHook returns (uint256 volatilityBps) {
        ObservationWindow storage window = windows[poolId];

        if (window.lastSqrtPrice == 0) {
            window.lastSqrtPrice = sqrtPrice;
            emit VolatilityUpdated(poolId, sqrtPrice, 0);
            return 0;
        }

        uint256 deltaBps = _absDeltaBps(window.lastSqrtPrice, sqrtPrice);
        uint256 replaced = window.deltas[window.cursor];

        window.deltas[window.cursor] = deltaBps;
        window.cursor = (window.cursor + 1) % WINDOW;
        window.lastSqrtPrice = sqrtPrice;

        if (window.count < WINDOW) {
            window.count += 1;
            window.sumAbsDeltaBps += deltaBps;
        } else {
            window.sumAbsDeltaBps = window.sumAbsDeltaBps + deltaBps - replaced;
        }

        volatilityBps = window.sumAbsDeltaBps / window.count;

        emit VolatilityUpdated(poolId, sqrtPrice, volatilityBps);
    }

    function getVolatilityBps(bytes32 poolId) external view returns (uint256) {
        ObservationWindow storage window = windows[poolId];
        if (window.count == 0) return 0;
        return window.sumAbsDeltaBps / window.count;
    }

    function getLastSqrtPrice(bytes32 poolId) external view returns (uint160) {
        return windows[poolId].lastSqrtPrice;
    }

    function _absDeltaBps(uint160 previous, uint160 current) private pure returns (uint256) {
        if (previous == 0) return 0;

        uint256 larger = current > previous ? uint256(current) : uint256(previous);
        uint256 smaller = current > previous ? uint256(previous) : uint256(current);

        uint256 midpoint = (uint256(previous) + uint256(current)) / 2;

        return ((larger - smaller) * BPS) / midpoint;
    }
}
