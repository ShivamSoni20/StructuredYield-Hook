// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract ILCoverageTest is Test {
    StructuredYieldHook private hook;
    address private constant USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private lp = address(0xCAFE);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    function setUp() public {
        MockERC20 mock = new MockERC20();
        vm.etch(USDC, address(mock).code);
        hook = new StructuredYieldHook();
        hook.initializePool(poolId, block.timestamp + 90 days);
        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);
    }

    function testThirtyPercentMoveIsCoveredWhenReserveSolvent() public {
        _fundVaultWithTokens(500 ether);
        uint160 currentSqrtPrice = uint160((uint256(sqrtPrice) * 1_140_175_425) / 1_000_000_000);

        (uint256 ilAmount, uint256 ilBps) = hook.quoteIL(poolId, lp, currentSqrtPrice);
        assertApproxEqAbs(ilBps, 85, 2);

        vm.warp(block.timestamp + 90 days);
        hook.beforeRemoveLiquidity(poolId, lp, currentSqrtPrice);

        (,,,,, uint256 ilCovered,,) = hook.positions(poolId, lp);
        assertEq(ilCovered, ilAmount);
    }

    function testExtremeMoveIsCappedByReserve() public {
        _fundVaultWithTokens(250 ether);
        uint160 currentSqrtPrice = uint160((uint256(sqrtPrice) * 1_800_000_000) / 1_000_000_000);

        vm.warp(block.timestamp + 90 days);
        hook.beforeRemoveLiquidity(poolId, lp, currentSqrtPrice);

        (,,,,, uint256 ilCovered,,) = hook.positions(poolId, lp);
        assertEq(ilCovered, 250 ether);
    }

    function _fundVaultWithTokens(uint256 amount) internal {
        MockERC20 token = MockERC20(USDC);
        token.mint(address(this), amount);
        token.approve(address(hook.insuranceVault()), amount);
        hook.insuranceVault().fundWithTokens(poolId, amount);
    }
}
