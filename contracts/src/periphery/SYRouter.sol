// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {StructuredYieldHook} from "../StructuredYieldHook.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IERC20Minimal} from "@uniswap/v4-core/src/interfaces/external/IERC20Minimal.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

contract SYRouter is IUnlockCallback {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;
    using TransientStateLibrary for IPoolManager;

    enum UnlockAction {
        AddLiquidity,
        RemoveLiquidity,
        SwapExactInputSingle
    }

    struct UnlockData {
        UnlockAction action;
        address payer;
        address recipient;
        PoolKey key;
        IPoolManager.ModifyLiquidityParams modifyParams;
        IPoolManager.SwapParams swapParams;
        bytes hookData;
    }

    StructuredYieldHook public immutable hook;
    IPoolManager public immutable poolManager;
    bool public immutable isScaffoldMode;

    event DepositAndMint(bytes32 indexed poolId, address indexed lp, uint256 depositValue, uint160 referenceSqrtPrice);
    event RemoveAndRedeem(bytes32 indexed poolId, address indexed lp, uint160 currentSqrtPrice);
    event V4SwapExecuted(bytes32 indexed poolId, address indexed swapper, bool zeroForOne, uint128 amountIn);

    error ProductionPoolManagerRequired();
    error ScaffoldOnlyOperation();
    error UnauthorizedPoolManager();
    error PoolManagerRequired();
    error InvalidAmount();
    error ERC20TransferFailed();

    constructor(StructuredYieldHook hook_, IPoolManager poolManager_, bool isScaffoldMode_) {
        hook = hook_;
        poolManager = poolManager_;
        isScaffoldMode = isScaffoldMode_;
    }

    receive() external payable {}

    function initializePool(bytes32 poolId, uint256 maturityTimestamp)
        external
        returns (address ptToken, address ytToken)
    {
        if (!isScaffoldMode) revert ScaffoldOnlyOperation();
        return hook.initializePool(poolId, maturityTimestamp);
    }

    function depositAndMint(bytes32 poolId, uint256 depositValue, uint160 referenceSqrtPrice)
        external
        returns (bytes4 selector)
    {
        if (!isScaffoldMode) revert ProductionPoolManagerRequired();
        selector = hook.beforeAddLiquidity(poolId, msg.sender, depositValue, referenceSqrtPrice);
        emit DepositAndMint(poolId, msg.sender, depositValue, referenceSqrtPrice);
    }

    function removeAndRedeem(bytes32 poolId, uint160 currentSqrtPrice) external returns (bytes4 selector) {
        if (!isScaffoldMode) revert ProductionPoolManagerRequired();
        hook.beforeRemoveLiquidity(poolId, msg.sender, currentSqrtPrice);
        selector = hook.afterRemoveLiquidity(poolId, msg.sender);
        emit RemoveAndRedeem(poolId, msg.sender, currentSqrtPrice);
    }

    function claimFees(bytes32 poolId) external returns (uint256 claimedFees) {
        return hook.claimFees(poolId, msg.sender);
    }

    function addLiquidityToPool(
        PoolKey calldata key,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 depositValue,
        uint160 referenceSqrtPrice
    ) external payable returns (BalanceDelta delta) {
        if (isScaffoldMode) revert ScaffoldOnlyOperation();
        if (address(poolManager) == address(0)) revert PoolManagerRequired();
        if (liquidity == 0 || depositValue == 0) revert InvalidAmount();

        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: int256(uint256(liquidity)),
            salt: bytes32(0)
        });

        bytes memory hookData = abi.encode(msg.sender, depositValue, referenceSqrtPrice);
        delta = abi.decode(
            poolManager.unlock(
                abi.encode(
                    UnlockData({
                        action: UnlockAction.AddLiquidity,
                        payer: msg.sender,
                        recipient: msg.sender,
                        key: key,
                        modifyParams: params,
                        swapParams: IPoolManager.SwapParams({
                            zeroForOne: false,
                            amountSpecified: 0,
                            sqrtPriceLimitX96: 0
                        }),
                        hookData: hookData
                    })
                )
            ),
            (BalanceDelta)
        );

        PoolId poolId = key.toId();
        emit DepositAndMint(PoolId.unwrap(poolId), msg.sender, depositValue, referenceSqrtPrice);
    }

    function removeLiquidityFromPool(
        PoolKey calldata key,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint160 currentSqrtPrice
    ) external payable returns (BalanceDelta delta) {
        if (isScaffoldMode) revert ScaffoldOnlyOperation();
        if (address(poolManager) == address(0)) revert PoolManagerRequired();
        if (liquidity == 0) revert InvalidAmount();

        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: -int256(uint256(liquidity)),
            salt: bytes32(0)
        });

        bytes memory hookData = abi.encode(msg.sender, currentSqrtPrice);
        delta = abi.decode(
            poolManager.unlock(
                abi.encode(
                    UnlockData({
                        action: UnlockAction.RemoveLiquidity,
                        payer: msg.sender,
                        recipient: msg.sender,
                        key: key,
                        modifyParams: params,
                        swapParams: IPoolManager.SwapParams({
                            zeroForOne: false,
                            amountSpecified: 0,
                            sqrtPriceLimitX96: 0
                        }),
                        hookData: hookData
                    })
                )
            ),
            (BalanceDelta)
        );

        PoolId poolId = key.toId();
        emit RemoveAndRedeem(PoolId.unwrap(poolId), msg.sender, currentSqrtPrice);
    }

    function swapExactInputSingle(
        PoolKey calldata key,
        bool zeroForOne,
        uint128 amountIn,
        uint160 sqrtPriceLimitX96,
        uint160 currentSqrtPrice
    ) external payable returns (BalanceDelta delta) {
        if (isScaffoldMode) revert ScaffoldOnlyOperation();
        if (address(poolManager) == address(0)) revert PoolManagerRequired();
        if (amountIn == 0) revert InvalidAmount();

        bytes memory hookData = abi.encode(currentSqrtPrice);
        delta = abi.decode(
            poolManager.unlock(
                abi.encode(
                    UnlockData({
                        action: UnlockAction.SwapExactInputSingle,
                        payer: msg.sender,
                        recipient: msg.sender,
                        key: key,
                        modifyParams: IPoolManager.ModifyLiquidityParams({
                            tickLower: 0,
                            tickUpper: 0,
                            liquidityDelta: 0,
                            salt: bytes32(0)
                        }),
                        swapParams: IPoolManager.SwapParams({
                            zeroForOne: zeroForOne,
                            amountSpecified: -int256(uint256(amountIn)),
                            sqrtPriceLimitX96: sqrtPriceLimitX96
                        }),
                        hookData: hookData
                    })
                )
            ),
            (BalanceDelta)
        );

        PoolId poolId = key.toId();
        emit V4SwapExecuted(PoolId.unwrap(poolId), msg.sender, zeroForOne, amountIn);
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert UnauthorizedPoolManager();

        UnlockData memory data = abi.decode(rawData, (UnlockData));
        BalanceDelta delta;

        if (data.action == UnlockAction.AddLiquidity || data.action == UnlockAction.RemoveLiquidity) {
            (delta,) = poolManager.modifyLiquidity(data.key, data.modifyParams, data.hookData);
        } else {
            delta = poolManager.swap(data.key, data.swapParams, data.hookData);
        }

        _settleOpenDelta(data.key.currency0, data.payer, data.recipient);
        _settleOpenDelta(data.key.currency1, data.payer, data.recipient);

        return abi.encode(delta);
    }

    function _settleOpenDelta(Currency currency, address payer, address recipient) internal {
        int256 delta = poolManager.currencyDelta(address(this), currency);
        if (delta < 0) {
            _settle(currency, payer, uint256(-delta));
        } else if (delta > 0) {
            poolManager.take(currency, recipient, uint256(delta));
        }
    }

    function _settle(Currency currency, address payer, uint256 amount) internal {
        if (currency.isAddressZero()) {
            poolManager.settle{value: amount}();
            return;
        }

        poolManager.sync(currency);
        bool success = IERC20Minimal(Currency.unwrap(currency)).transferFrom(payer, address(poolManager), amount);
        if (!success) revert ERC20TransferFailed();
        poolManager.settle();
    }
}
