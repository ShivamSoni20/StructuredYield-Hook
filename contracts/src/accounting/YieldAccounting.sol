// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract YieldAccounting {
    uint256 internal constant Q128 = 2 ** 128;

    address public immutable hook;

    mapping(bytes32 => uint256) public feeIndex;
    mapping(bytes32 => mapping(address => uint256)) public feeIndexSnapshot;
    mapping(bytes32 => uint256) public totalAccruedFees;
    mapping(bytes32 => mapping(address => uint256)) public claimedFees;

    event FeesAccrued(bytes32 indexed poolId, uint256 feeAmount, uint256 newFeeIndex);
    event FeesClaimed(bytes32 indexed poolId, address indexed lp, uint256 amount);

    error NotHook();

    modifier onlyHook() {
        if (msg.sender != hook) revert NotHook();
        _;
    }

    constructor(address hook_) {
        hook = hook_;
    }

    function accrueFees(bytes32 poolId, uint256 feeAmount, uint256 totalYTSupply) external onlyHook {
        if (feeAmount == 0 || totalYTSupply == 0) return;

        feeIndex[poolId] += (feeAmount * Q128) / totalYTSupply;
        totalAccruedFees[poolId] += feeAmount;

        emit FeesAccrued(poolId, feeAmount, feeIndex[poolId]);
    }

    function claimFees(bytes32 poolId, address lp, uint256 ytBalance) external onlyHook returns (uint256 owed) {
        uint256 currentIndex = feeIndex[poolId];
        uint256 snapshot = feeIndexSnapshot[poolId][lp];

        if (currentIndex <= snapshot || ytBalance == 0) {
            feeIndexSnapshot[poolId][lp] = currentIndex;
            emit FeesClaimed(poolId, lp, 0);
            return 0;
        }

        owed = ((currentIndex - snapshot) * ytBalance) / Q128;
        feeIndexSnapshot[poolId][lp] = currentIndex;
        claimedFees[poolId][lp] += owed;

        emit FeesClaimed(poolId, lp, owed);
    }

    function checkpoint(bytes32 poolId, address lp) external onlyHook {
        feeIndexSnapshot[poolId][lp] = feeIndex[poolId];
    }
}

