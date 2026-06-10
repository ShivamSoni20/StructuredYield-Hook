// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";
import {SYLens} from "../../src/periphery/SYLens.sol";

contract SYLensTest is Test {
    StructuredYieldHook private hook;
    SYLens private lens;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private lp = address(0xCAFE);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    function setUp() public {
        hook = new StructuredYieldHook();
        lens = new SYLens(hook);
    }

    function testGetPositionAggregatesBalancesAndRisk() public {
        hook.initializePool(poolId, block.timestamp + 90 days);
        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);
        hook.fundInsuranceReserve(poolId, 3_000 ether);

        SYLens.PositionView memory view_ = lens.getPosition(poolId, lp, sqrtPrice * 2);

        assertTrue(view_.active);
        assertEq(view_.ptBalance, 10_000 ether);
        assertEq(view_.currentILBps, 2_000);
        assertEq(view_.currentILAmount, 2_000 ether);
        assertTrue(view_.isVaultSolvent);
    }

    function testGetPositionReportsPendingClaimableFees() public {
        hook.initializePool(poolId, block.timestamp + 90 days);
        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);

        hook.afterSwap(poolId, 1_000 ether, sqrtPrice);

        SYLens.PositionView memory view_ = lens.getPosition(poolId, lp, sqrtPrice);

        assertApproxEqAbs(view_.accruedFees, 800 ether, 1);
    }
}
