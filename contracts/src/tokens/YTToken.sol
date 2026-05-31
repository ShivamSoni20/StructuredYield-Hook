// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {HookMintableERC20} from "./HookMintableERC20.sol";

contract YTToken is HookMintableERC20 {
    constructor(address hook) HookMintableERC20("StructuredYield Yield LP", "YT-LP", hook) {}
}

