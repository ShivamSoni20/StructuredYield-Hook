// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IERC20Minimal} from "@uniswap/v4-core/src/interfaces/external/IERC20Minimal.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";
import {StructuredYieldV4Hook} from "../../src/StructuredYieldV4Hook.sol";
import {SYRouter} from "../../src/periphery/SYRouter.sol";
import {PTToken} from "../../src/tokens/PTToken.sol";

contract V4IntegrationTest is Test {
    using PoolIdLibrary for PoolKey;

    address private constant POOL_MANAGER_ADDR = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC;
    address private constant WETH = 0x4200000000000000000000000000000000000006;
    address private constant USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
    uint24 private constant FEE = 3_000;
    int24 private constant TICK_SPACING = 60;
    int24 private constant TICK_LOWER = -887220;
    int24 private constant TICK_UPPER = 887220;

    bool private forkEnabled;
    IPoolManager private poolManager;
    StructuredYieldV4Hook private hook;
    SYRouter private router;
    PoolKey private poolKey;
    bytes32 private poolId;
    address private lp = address(0xCAFE);
    address private swapper = address(0xBEEF);

    function setUp() public {
        string memory rpcUrl = vm.envOr("UNICHAIN_SEPOLIA_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        vm.createSelectFork(rpcUrl);
        forkEnabled = true;

        poolManager = IPoolManager(POOL_MANAGER_ADDR);
        hook = _deployMinedHook();
        router = new SYRouter(hook, poolManager, false);

        (address token0, address token1) = WETH < USDC ? (WETH, USDC) : (USDC, WETH);
        poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });
        poolId = PoolId.unwrap(poolKey.toId());
    }

    function testPoolInitializationTriggersStructuredYieldLifecycle() public {
        if (!_enabled()) return;

        poolManager.initialize(poolKey, TickMath.getSqrtPriceAtTick(0));

        (, address ptToken, address ytToken,,,, bool initialized) = hook.pools(poolId);
        assertTrue(initialized);
        assertTrue(ptToken != address(0));
        assertTrue(ytToken != address(0));
    }

    function testRealModifyLiquidityMintsPTYT() public {
        if (!_enabled()) return;

        poolManager.initialize(poolKey, TickMath.getSqrtPriceAtTick(0));
        _fundAndApprove(lp);

        uint256 depositValue = 10_000 ether;
        vm.prank(lp);
        router.addLiquidityToPool(poolKey, TICK_LOWER, TICK_UPPER, 1e12, depositValue, TickMath.getSqrtPriceAtTick(0));

        (, address ptToken,,,,,) = hook.pools(poolId);
        assertEq(PTToken(ptToken).balanceOf(lp), depositValue);
    }

    function testRealSwapTriggersAfterSwapFeeRouting() public {
        if (!_enabled()) return;

        poolManager.initialize(poolKey, TickMath.getSqrtPriceAtTick(0));
        _fundAndApprove(lp);

        vm.prank(lp);
        router.addLiquidityToPool(poolKey, TICK_LOWER, TICK_UPPER, 1e12, 10_000 ether, TickMath.getSqrtPriceAtTick(0));

        _fundAndApprove(swapper);

        bool zeroForOne = Currency.unwrap(poolKey.currency0) == USDC;
        vm.prank(swapper);
        router.swapExactInputSingle(
            poolKey,
            zeroForOne,
            1e6,
            zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1,
            TickMath.getSqrtPriceAtTick(0)
        );

        (,,, uint256 insuranceReserve, uint256 feeBuffer,,) = hook.pools(poolId);
        assertGt(insuranceReserve + feeBuffer, 0);
    }

    function _deployMinedHook() internal returns (StructuredYieldV4Hook minedHook) {
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG
                | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        (, bytes32 salt) = HookMiner.find(address(this), flags, type(StructuredYieldV4Hook).creationCode, "");
        minedHook = new StructuredYieldV4Hook{salt: salt}();
    }

    function _fundAndApprove(address account) internal {
        deal(WETH, account, 1_000 ether);
        deal(USDC, account, 1_000_000e6);

        vm.startPrank(account);
        IERC20Minimal(WETH).approve(address(router), type(uint256).max);
        IERC20Minimal(USDC).approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function _enabled() internal returns (bool) {
        if (forkEnabled) return true;
        emit log("Set UNICHAIN_SEPOLIA_RPC_URL to enable V4 integration fork tests.");
        return false;
    }
}
