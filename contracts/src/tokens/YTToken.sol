// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {HookMintableERC20} from "./HookMintableERC20.sol";

/// @title YTToken
/// @notice YT-LP represents the fee stream from an LP position until maturity.
///         Transfers are disabled in V1 because fee accounting is position-based.
contract YTToken is HookMintableERC20 {
    error YTTransferDisabled(string reason);

    constructor(address hook) HookMintableERC20("StructuredYield Yield LP", "YT-LP", hook) {}

    function transfer(address, uint256) external pure override returns (bool) {
        revert YTTransferDisabled(
            "YT-LP V1: fee accounting is position-based. Transfer disabled until V2 snapshot ownership."
        );
    }

    function transferFrom(address, address, uint256) external pure override returns (bool) {
        revert YTTransferDisabled(
            "YT-LP V1: fee accounting is position-based. Transfer disabled until V2 snapshot ownership."
        );
    }
}
