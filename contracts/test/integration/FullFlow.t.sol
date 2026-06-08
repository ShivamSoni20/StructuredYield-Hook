// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";
import {SYRouter} from "../../src/periphery/SYRouter.sol";
import {PTToken} from "../../src/tokens/PTToken.sol";
import {YTToken} from "../../src/tokens/YTToken.sol";

contract FullFlowTest is Test {
    StructuredYieldHook private hook;
    SYRouter private router;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private lp = address(0xCAFE);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    event PositionClosed(bytes32 indexed poolId, address indexed lp, uint256 principal, uint256 totalFees);

    function setUp() public {
        hook = new StructuredYieldHook();
        router = new SYRouter(hook, IPoolManager(address(0)), true);
    }

    function testDepositSwapMatureRedeemFlow() public {
        uint256 maturity = block.timestamp + 90 days;
        (address ptToken, address ytToken) = router.initializePool(poolId, maturity);

        vm.prank(lp);
        router.depositAndMint(poolId, 50_000 ether, sqrtPrice);

        hook.afterSwap(poolId, 1_000 ether, sqrtPrice);

        vm.prank(lp);
        uint256 claimed = router.claimFees(poolId);
        assertApproxEqAbs(claimed, 800 ether, 1);

        vm.warp(maturity);
        vm.expectEmit(true, true, false, true);
        emit PositionClosed(poolId, lp, 50_000 ether, claimed);
        vm.prank(lp);
        router.removeAndRedeem(poolId, sqrtPrice);

        assertEq(PTToken(ptToken).balanceOf(lp), 0);
        assertEq(YTToken(ytToken).balanceOf(lp), 0);
    }
}
