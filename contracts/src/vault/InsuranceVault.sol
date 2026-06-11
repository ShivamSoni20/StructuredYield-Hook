// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title InsuranceVault
/// @notice Holds real ERC-20 reserve tokens to cover LP impermanent loss at maturity.
///         For the Unichain Sepolia demo, reserve backing is USDC. The hook can still
///         record accounting reserves from fee routing, while anyone can back those
///         reserves with real USDC through `fundWithTokens`.
contract InsuranceVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable hook;
    IERC20 public immutable reserveToken;

    mapping(bytes32 => uint256) public reserves;
    mapping(bytes32 => uint256) public tokenReserves;
    mapping(bytes32 => uint256) public totalPaid;

    event ReserveFunded(bytes32 indexed poolId, uint256 amount, uint256 newReserve);
    event TokensDeposited(bytes32 indexed poolId, address indexed depositor, uint256 amount);
    event ILCovered(bytes32 indexed poolId, address indexed lp, uint256 requested, uint256 paid);

    error NotHook();
    error InvalidAmount();

    modifier onlyHook() {
        if (msg.sender != hook) revert NotHook();
        _;
    }

    constructor(address hook_, address reserveToken_) {
        hook = hook_;
        reserveToken = IERC20(reserveToken_);
    }

    function fund(bytes32 poolId, uint256 amount) external onlyHook {
        if (amount == 0) revert InvalidAmount();

        reserves[poolId] += amount;

        emit ReserveFunded(poolId, amount, reserves[poolId]);
    }

    function fundWithTokens(bytes32 poolId, uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        reserveToken.safeTransferFrom(msg.sender, address(this), amount);
        tokenReserves[poolId] += amount;
        reserves[poolId] += amount;

        emit TokensDeposited(poolId, msg.sender, amount);
        emit ReserveFunded(poolId, amount, reserves[poolId]);
    }

    function payout(bytes32 poolId, address lp, uint256 requestedAmount)
        external
        onlyHook
        nonReentrant
        returns (uint256 paid)
    {
        if (requestedAmount == 0) {
            emit ILCovered(poolId, lp, 0, 0);
            return 0;
        }

        uint256 acctReserve = reserves[poolId];
        uint256 tokenBalance = reserveToken.balanceOf(address(this));

        uint256 cappedByReserve = requestedAmount < acctReserve ? requestedAmount : acctReserve;
        paid = cappedByReserve < tokenBalance ? cappedByReserve : tokenBalance;

        if (paid == 0) {
            emit ILCovered(poolId, lp, requestedAmount, 0);
            return 0;
        }

        unchecked {
            reserves[poolId] = acctReserve - paid;
            if (tokenReserves[poolId] >= paid) tokenReserves[poolId] -= paid;
        }
        totalPaid[poolId] += paid;

        reserveToken.safeTransfer(lp, paid);

        emit ILCovered(poolId, lp, requestedAmount, paid);
    }

    function isSolvent(bytes32 poolId, uint256 liability) external view returns (bool) {
        if (liability == 0) return true;
        return reserves[poolId] >= liability && reserveToken.balanceOf(address(this)) >= liability;
    }

    function realSolvency(bytes32 poolId) external view returns (uint256 realBacking) {
        uint256 tokenBalance = reserveToken.balanceOf(address(this));
        uint256 acctReserve = reserves[poolId];
        realBacking = tokenBalance < acctReserve ? tokenBalance : acctReserve;
    }
}
