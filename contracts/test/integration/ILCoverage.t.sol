// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";

contract ILCoverageTest is Test {
    StructuredYieldHook private hook;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private lp = address(0xCAFE);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    function setUp() public {
        hook = new StructuredYieldHook();
        hook.initializePool(poolId, block.timestamp + 90 days);
        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);
    }

    function testThirtyPercentMoveIsCoveredWhenReserveSolvent() public {
        hook.fundInsuranceReserve(poolId, 500 ether);
        uint160 currentSqrtPrice = uint160((uint256(sqrtPrice) * 1_140_175_425) / 1_000_000_000);

        (uint256 ilAmount, uint256 ilBps) = hook.quoteIL(poolId, lp, currentSqrtPrice);
        assertApproxEqAbs(ilBps, 85, 2);

        vm.warp(block.timestamp + 90 days);
        hook.beforeRemoveLiquidity(poolId, lp, currentSqrtPrice);

        (,,,,, uint256 ilCovered,,) = hook.positions(poolId, lp);
        assertEq(ilCovered, ilAmount);
    }

    function testExtremeMoveIsCappedByReserve() public {
        hook.fundInsuranceReserve(poolId, 250 ether);
        uint160 currentSqrtPrice = uint160((uint256(sqrtPrice) * 1_800_000_000) / 1_000_000_000);

        vm.warp(block.timestamp + 90 days);
        hook.beforeRemoveLiquidity(poolId, lp, currentSqrtPrice);

        (,,,,, uint256 ilCovered,,) = hook.positions(poolId, lp);
        assertEq(ilCovered, 250 ether);
    }
}
