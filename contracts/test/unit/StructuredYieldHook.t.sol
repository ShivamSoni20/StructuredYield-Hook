// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";
import {PTToken} from "../../src/tokens/PTToken.sol";
import {YTToken} from "../../src/tokens/YTToken.sol";

contract StructuredYieldHookTest is Test {
    StructuredYieldHook private hook;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private lp = address(0xCAFE);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    function setUp() public {
        hook = new StructuredYieldHook();
    }

    function testMintOnDeposit() public {
        uint256 maturity = block.timestamp + 90 days;
        (address ptToken, address ytToken) = hook.initializePool(poolId, maturity);

        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);

        (
            uint256 depositedValue,
            uint160 referenceSqrtPrice,
            uint256 ptMinted,
            uint256 ytMinted,
            uint256 depositTimestamp,
            uint256 ilCovered,
            uint256 feesClaimed,
            bool active
        ) = hook.positions(poolId, lp);

        assertEq(depositedValue, 10_000 ether);
        assertEq(referenceSqrtPrice, sqrtPrice);
        assertEq(ptMinted, 10_000 ether);
        assertEq(ytMinted, (uint256(10_000 ether) * 90 days) / 365 days);
        assertEq(depositTimestamp, block.timestamp);
        assertEq(ilCovered, 0);
        assertEq(feesClaimed, 0);
        assertTrue(active);
        assertEq(PTToken(ptToken).balanceOf(lp), 10_000 ether);
        assertEq(YTToken(ytToken).balanceOf(lp), ytMinted);
    }

    function testBurnOnRedeem() public {
        uint256 maturity = block.timestamp + 30 days;
        (address ptToken, address ytToken) = hook.initializePool(poolId, maturity);

        hook.beforeAddLiquidity(poolId, lp, 5_000 ether, sqrtPrice);
        vm.warp(maturity);

        hook.afterRemoveLiquidity(poolId, lp);

        assertEq(PTToken(ptToken).balanceOf(lp), 0);
        assertEq(YTToken(ytToken).balanceOf(lp), 0);
        assertEq(PTToken(ptToken).totalSupply(), 0);
        assertEq(YTToken(ytToken).totalSupply(), 0);

        (,,,,,,, bool active) = hook.positions(poolId, lp);
        assertFalse(active);
    }

    function testCannotRedeemBeforeMaturity() public {
        uint256 maturity = block.timestamp + 30 days;
        hook.initializePool(poolId, maturity);
        hook.beforeAddLiquidity(poolId, lp, 5_000 ether, sqrtPrice);

        vm.expectRevert();
        hook.afterRemoveLiquidity(poolId, lp);
    }

    function testAfterSwapRoutesFeesToYTAndInsurance() public {
        uint256 maturity = block.timestamp + 90 days;
        hook.initializePool(poolId, maturity);
        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);

        hook.afterSwap(poolId, 100 ether);

        assertApproxEqAbs(hook.claimFees(poolId, lp), 80 ether, 1);
        assertEq(hook.insuranceVault().reserves(poolId), 20 ether);
    }

    function testBeforeRemoveLiquidityCoversILFromVault() public {
        uint256 maturity = block.timestamp + 90 days;
        hook.initializePool(poolId, maturity);
        hook.beforeAddLiquidity(poolId, lp, 10_000 ether, sqrtPrice);
        hook.fundInsuranceReserve(poolId, 3_000 ether);

        uint160 doubledSqrtPrice = sqrtPrice * 2;
        (uint256 ilAmount, uint256 ilBps) = hook.quoteIL(poolId, lp, doubledSqrtPrice);
        assertEq(ilBps, 2_000);
        assertEq(ilAmount, 2_000 ether);

        hook.beforeRemoveLiquidity(poolId, lp, doubledSqrtPrice);

        (,,,,, uint256 ilCovered,, bool active) = hook.positions(poolId, lp);
        assertTrue(active);
        assertEq(ilCovered, 2_000 ether);
        assertEq(hook.insuranceVault().reserves(poolId), 1_000 ether);
    }
}
