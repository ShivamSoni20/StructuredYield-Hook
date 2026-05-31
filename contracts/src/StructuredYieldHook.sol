// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PTToken} from "./tokens/PTToken.sol";
import {YTToken} from "./tokens/YTToken.sol";
import {VolatilityOracle} from "./accounting/VolatilityOracle.sol";
import {YieldAccounting} from "./accounting/YieldAccounting.sol";
import {ILMath} from "./math/ILMath.sol";
import {PremiumMath} from "./math/PremiumMath.sol";
import {InsuranceVault} from "./vault/InsuranceVault.sol";

contract StructuredYieldHook {
    uint256 public constant YT_FEE_SHARE_BPS = 8_000;
    uint256 public constant INSURANCE_FEE_SHARE_BPS = 2_000;
    uint256 public constant BPS = 10_000;

    struct PoolConfig {
        uint256 maturityTimestamp;
        address ptToken;
        address ytToken;
        uint256 insuranceReserve;
        uint256 feeBuffer;
        uint256 volatilityBps;
        bool initialized;
    }

    struct LPPosition {
        uint256 depositedValue;
        uint160 referenceSqrtPrice;
        uint256 ptMinted;
        uint256 ytMinted;
        uint256 depositTimestamp;
        uint256 ilCovered;
        uint256 feesClaimed;
        bool active;
    }

    InsuranceVault public immutable insuranceVault;
    VolatilityOracle public immutable volatilityOracle;
    YieldAccounting public immutable yieldAccounting;

    mapping(bytes32 => PoolConfig) public pools;
    mapping(bytes32 => mapping(address => LPPosition)) public positions;

    event PoolInitialized(bytes32 indexed poolId, address ptToken, address ytToken, uint256 maturity);
    event PTYTMinted(bytes32 indexed poolId, address indexed lp, uint256 ptAmount, uint256 ytAmount, uint256 maturity);
    event FeesRouted(bytes32 indexed poolId, uint256 ytFees, uint256 insuranceFees);
    event ILCovered(bytes32 indexed poolId, address indexed lp, uint256 ilAmount, uint256 paidAmount);
    event PositionClosed(bytes32 indexed poolId, address indexed lp, uint256 principal, uint256 totalFees);

    error PoolAlreadyInitialized();
    error PoolNotInitialized();
    error InvalidMaturity();
    error InvalidDepositValue();
    error PositionNotActive();
    error PositionMatured();
    error PositionNotMatured();

    constructor() {
        insuranceVault = new InsuranceVault(address(this));
        volatilityOracle = new VolatilityOracle(address(this));
        yieldAccounting = new YieldAccounting(address(this));
    }

    function initializePool(bytes32 poolId, uint256 maturityTimestamp) external returns (address ptToken, address ytToken) {
        if (pools[poolId].initialized) revert PoolAlreadyInitialized();
        if (maturityTimestamp <= block.timestamp) revert InvalidMaturity();

        PTToken pt = new PTToken(address(this));
        YTToken yt = new YTToken(address(this));

        ptToken = address(pt);
        ytToken = address(yt);

        pools[poolId] = PoolConfig({
            maturityTimestamp: maturityTimestamp,
            ptToken: ptToken,
            ytToken: ytToken,
            insuranceReserve: 0,
            feeBuffer: 0,
            volatilityBps: 1_000,
            initialized: true
        });

        emit PoolInitialized(poolId, ptToken, ytToken, maturityTimestamp);
    }

    function beforeAddLiquidity(
        bytes32 poolId,
        address lp,
        uint256 depositValue,
        uint160 referenceSqrtPrice
    ) external returns (bytes4) {
        PoolConfig memory pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();
        if (depositValue == 0) revert InvalidDepositValue();
        if (block.timestamp >= pool.maturityTimestamp) revert PositionMatured();

        uint256 ytAmount = _computeYTAmount(depositValue, pool.maturityTimestamp);

        positions[poolId][lp] = LPPosition({
            depositedValue: depositValue,
            referenceSqrtPrice: referenceSqrtPrice,
            ptMinted: depositValue,
            ytMinted: ytAmount,
            depositTimestamp: block.timestamp,
            ilCovered: 0,
            feesClaimed: 0,
            active: true
        });

        PTToken(pool.ptToken).mint(lp, depositValue);
        YTToken(pool.ytToken).mint(lp, ytAmount);
        yieldAccounting.checkpoint(poolId, lp);

        emit PTYTMinted(poolId, lp, depositValue, ytAmount, pool.maturityTimestamp);

        return this.beforeAddLiquidity.selector;
    }

    function afterSwap(bytes32 poolId, uint256 feeAmount) external returns (bytes4) {
        return afterSwap(poolId, feeAmount, 0);
    }

    function afterSwap(bytes32 poolId, uint256 feeAmount, uint160 currentSqrtPrice) public returns (bytes4) {
        PoolConfig storage pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();
        if (currentSqrtPrice != 0) {
            pool.volatilityBps = volatilityOracle.observe(poolId, currentSqrtPrice);
        }
        if (feeAmount == 0) return this.afterSwap.selector;

        uint256 ytFees = (feeAmount * YT_FEE_SHARE_BPS) / BPS;
        uint256 insuranceFees = feeAmount - ytFees;
        uint256 totalYTSupply = YTToken(pool.ytToken).totalSupply();

        pool.feeBuffer += ytFees;
        pool.insuranceReserve += insuranceFees;

        yieldAccounting.accrueFees(poolId, ytFees, totalYTSupply);
        if (insuranceFees > 0) insuranceVault.fund(poolId, insuranceFees);

        emit FeesRouted(poolId, ytFees, insuranceFees);

        return this.afterSwap.selector;
    }

    function beforeRemoveLiquidity(
        bytes32 poolId,
        address lp,
        uint160 currentSqrtPrice
    ) external returns (bytes4) {
        PoolConfig storage pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        LPPosition storage position = positions[poolId][lp];
        if (!position.active) revert PositionNotActive();

        (uint256 ilAmount,) = ILMath.quoteILAmount(
            position.depositedValue,
            position.referenceSqrtPrice,
            currentSqrtPrice
        );
        uint256 paid = insuranceVault.payout(poolId, lp, ilAmount);

        if (paid > 0) {
            position.ilCovered += paid;
            pool.insuranceReserve = insuranceVault.reserves(poolId);
        }

        emit ILCovered(poolId, lp, ilAmount, paid);

        return this.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(bytes32 poolId, address lp) external returns (bytes4) {
        PoolConfig memory pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        LPPosition memory position = positions[poolId][lp];
        if (!position.active) revert PositionNotActive();
        if (block.timestamp < pool.maturityTimestamp) revert PositionNotMatured();

        uint256 claimedFees = yieldAccounting.claimFees(poolId, lp, position.ytMinted);

        delete positions[poolId][lp];

        PTToken(pool.ptToken).burn(lp, position.ptMinted);
        YTToken(pool.ytToken).burn(lp, position.ytMinted);

        emit PositionClosed(poolId, lp, position.ptMinted, claimedFees);

        return this.afterRemoveLiquidity.selector;
    }

    function claimFees(bytes32 poolId, address lp) external returns (uint256 claimedFees) {
        PoolConfig memory pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        LPPosition storage position = positions[poolId][lp];
        if (!position.active) revert PositionNotActive();

        claimedFees = yieldAccounting.claimFees(poolId, lp, position.ytMinted);
        position.feesClaimed += claimedFees;
    }

    function fundInsuranceReserve(bytes32 poolId, uint256 amount) external {
        PoolConfig storage pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        pool.insuranceReserve += amount;
        insuranceVault.fund(poolId, amount);
    }

    function updateVolatility(bytes32 poolId, uint256 volatilityBps) external {
        PoolConfig storage pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        pool.volatilityBps = volatilityBps;
    }

    function quoteIL(bytes32 poolId, address lp, uint160 currentSqrtPrice)
        external
        view
        returns (uint256 ilAmount, uint256 ilBps)
    {
        LPPosition memory position = positions[poolId][lp];
        if (!position.active) revert PositionNotActive();

        return ILMath.quoteILAmount(position.depositedValue, position.referenceSqrtPrice, currentSqrtPrice);
    }

    function quotePremiumBps(bytes32 poolId) external view returns (uint256) {
        PoolConfig memory pool = pools[poolId];
        if (!pool.initialized) revert PoolNotInitialized();

        uint256 secondsToMaturity = block.timestamp >= pool.maturityTimestamp ? 0 : pool.maturityTimestamp - block.timestamp;
        uint256 reserveRatioBps = pool.insuranceReserve == 0 ? 0 : (pool.insuranceReserve * BPS) / 1e18;

        return PremiumMath.computePremiumBps(pool.volatilityBps, secondsToMaturity, reserveRatioBps);
    }

    function _computeYTAmount(uint256 depositValue, uint256 maturityTimestamp) internal view returns (uint256) {
        uint256 secondsToMaturity = maturityTimestamp - block.timestamp;
        return (depositValue * secondsToMaturity) / 365 days;
    }
}
