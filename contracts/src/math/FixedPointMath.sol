// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library FixedPointMath {
    function sqrt(uint256 value) internal pure returns (uint256 result) {
        if (value == 0) return 0;

        uint256 estimate = value;
        result = 1;

        if (estimate >= 2 ** 128) {
            estimate >>= 128;
            result <<= 64;
        }
        if (estimate >= 2 ** 64) {
            estimate >>= 64;
            result <<= 32;
        }
        if (estimate >= 2 ** 32) {
            estimate >>= 32;
            result <<= 16;
        }
        if (estimate >= 2 ** 16) {
            estimate >>= 16;
            result <<= 8;
        }
        if (estimate >= 2 ** 8) {
            estimate >>= 8;
            result <<= 4;
        }
        if (estimate >= 2 ** 4) {
            estimate >>= 4;
            result <<= 2;
        }
        if (estimate >= 2 ** 2) {
            result <<= 1;
        }

        unchecked {
            result = (result + value / result) >> 1;
            result = (result + value / result) >> 1;
            result = (result + value / result) >> 1;
            result = (result + value / result) >> 1;
            result = (result + value / result) >> 1;
            result = (result + value / result) >> 1;
            result = (result + value / result) >> 1;

            uint256 roundedDown = value / result;
            return result < roundedDown ? result : roundedDown;
        }
    }
}

