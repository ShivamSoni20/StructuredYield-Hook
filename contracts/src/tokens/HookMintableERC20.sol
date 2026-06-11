// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

abstract contract HookMintableERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    address public immutable hook;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    error NotHook();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    modifier onlyHook() {
        if (msg.sender != hook) revert NotHook();
        _;
    }

    constructor(string memory name_, string memory symbol_, address hook_) {
        if (hook_ == address(0)) revert ZeroAddress();
        name = name_;
        symbol = symbol_;
        hook = hook_;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external virtual returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external virtual returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance < amount) revert InsufficientAllowance();

        unchecked {
            allowance[from][msg.sender] = currentAllowance - amount;
        }

        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyHook {
        if (to == address(0)) revert ZeroAddress();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyHook {
        uint256 balance = balanceOf[from];
        if (balance < amount) revert InsufficientBalance();

        unchecked {
            balanceOf[from] = balance - amount;
            totalSupply -= amount;
        }

        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();

        uint256 balance = balanceOf[from];
        if (balance < amount) revert InsufficientBalance();

        unchecked {
            balanceOf[from] = balance - amount;
        }
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
    }
}
