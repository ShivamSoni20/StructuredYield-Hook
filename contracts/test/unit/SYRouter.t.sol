// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";
import {SYRouter} from "../../src/periphery/SYRouter.sol";
import {PTToken} from "../../src/tokens/PTToken.sol";

contract SYRouterTest is Test {
    StructuredYieldHook private hook;
    SYRouter private router;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private lp = address(0xCAFE);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    function setUp() public {
        hook = new StructuredYieldHook();
        router = new SYRouter(hook, IPoolManager(address(0)), true);
    }

    function testDepositAndMintUsesSenderAsLP() public {
        (address ptToken,) = router.initializePool(poolId, block.timestamp + 30 days);

        vm.prank(lp);
        router.depositAndMint(poolId, 1_000 ether, sqrtPrice);

        assertEq(PTToken(ptToken).balanceOf(lp), 1_000 ether);
    }

    function testClaimFeesUsesSenderAsLP() public {
        router.initializePool(poolId, block.timestamp + 30 days);

        vm.prank(lp);
        router.depositAndMint(poolId, 1_000 ether, sqrtPrice);

        hook.afterSwap(poolId, 100 ether);

        vm.prank(lp);
        uint256 claimed = router.claimFees(poolId);

        assertApproxEqAbs(claimed, 80 ether, 1);
    }

    function testProductionModeRejectsScaffoldEntrypoints() public {
        SYRouter productionRouter = new SYRouter(hook, IPoolManager(address(0xBEEF)), false);

        vm.expectRevert(SYRouter.ScaffoldOnlyOperation.selector);
        productionRouter.initializePool(poolId, block.timestamp + 30 days);

        vm.expectRevert(SYRouter.ProductionPoolManagerRequired.selector);
        productionRouter.depositAndMint(poolId, 1_000 ether, sqrtPrice);

        vm.expectRevert(SYRouter.ProductionPoolManagerRequired.selector);
        productionRouter.removeAndRedeem(poolId, sqrtPrice);
    }
}
