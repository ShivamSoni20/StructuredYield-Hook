// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {VolatilityOracle} from "../../src/accounting/VolatilityOracle.sol";

contract VolatilityOracleTest is Test {
    address private hook = address(0xBEEF);
    bytes32 private poolId = keccak256("ETH-USDC-3000");
    VolatilityOracle private oracle;

    function setUp() public {
        oracle = new VolatilityOracle(hook);
    }

    function testHookCanRecordRollingVolatility() public {
        vm.startPrank(hook);

        assertEq(oracle.observe(poolId, 100), 0);
        assertEq(oracle.observe(poolId, 110), 952);
        assertEq(oracle.observe(poolId, 99), 1_004);
        assertEq(oracle.getVolatilityBps(poolId), 1_004);

        vm.stopPrank();
    }

    function testEqualUpAndDownMovesUseSymmetricBps() public {
        vm.startPrank(hook);

        oracle.observe(poolId, 100);
        uint256 upMove = oracle.observe(poolId, 110);
        uint256 averageAfterDownMove = oracle.observe(poolId, 100);

        assertEq(upMove, 952);
        assertEq(averageAfterDownMove, 952);

        vm.stopPrank();
    }

    function testNonHookCannotObserve() public {
        vm.expectRevert();
        oracle.observe(poolId, 100);
    }
}
