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
        assertEq(oracle.observe(poolId, 110), 1_000);
        assertEq(oracle.observe(poolId, 99), 1_000);
        assertEq(oracle.getVolatilityBps(poolId), 1_000);

        vm.stopPrank();
    }

    function testNonHookCannotObserve() public {
        vm.expectRevert();
        oracle.observe(poolId, 100);
    }
}

