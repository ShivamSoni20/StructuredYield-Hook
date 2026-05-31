// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract InsuranceVault {
    address public immutable hook;

    mapping(bytes32 => uint256) public reserves;
    mapping(bytes32 => uint256) public totalPaid;

    event ReserveFunded(bytes32 indexed poolId, uint256 amount, uint256 newReserve);
    event ILCovered(bytes32 indexed poolId, address indexed lp, uint256 requested, uint256 paid);

    error NotHook();
    error InvalidAmount();

    modifier onlyHook() {
        if (msg.sender != hook) revert NotHook();
        _;
    }

    constructor(address hook_) {
        hook = hook_;
    }

    function fund(bytes32 poolId, uint256 amount) external onlyHook {
        if (amount == 0) revert InvalidAmount();

        reserves[poolId] += amount;

        emit ReserveFunded(poolId, amount, reserves[poolId]);
    }

    function payout(bytes32 poolId, address lp, uint256 requestedAmount) external onlyHook returns (uint256 paid) {
        uint256 reserve = reserves[poolId];
        paid = requestedAmount < reserve ? requestedAmount : reserve;

        if (paid == 0) {
            emit ILCovered(poolId, lp, requestedAmount, 0);
            return 0;
        }

        unchecked {
            reserves[poolId] = reserve - paid;
        }
        totalPaid[poolId] += paid;

        emit ILCovered(poolId, lp, requestedAmount, paid);
    }

    function isSolvent(bytes32 poolId, uint256 liability) external view returns (bool) {
        return reserves[poolId] >= liability;
    }
}

