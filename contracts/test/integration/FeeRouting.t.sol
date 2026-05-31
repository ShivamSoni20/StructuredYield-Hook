// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StructuredYieldHook} from "../../src/StructuredYieldHook.sol";

contract FeeRoutingTest is Test {
    StructuredYieldHook private hook;
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);
    uint160 private sqrtPrice = 79228162514264337593543950336;

    function setUp() public {
        hook = new StructuredYieldHook();
        hook.initializePool(poolId, block.timestamp + 90 days);
        hook.beforeAddLiquidity(poolId, alice, 10_000 ether, sqrtPrice);
        hook.beforeAddLiquidity(poolId, bob, 10_000 ether, sqrtPrice);
    }

    function testFeesRouteProRataToYTHoldersAndReserve() public {
        hook.afterSwap(poolId, 1_000 ether, sqrtPrice);

        assertEq(hook.claimFees(poolId, alice), 400 ether);
        assertEq(hook.claimFees(poolId, bob), 400 ether);
        assertEq(hook.insuranceVault().reserves(poolId), 200 ether);
    }
}

