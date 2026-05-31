# StructuredYield Mechanism

## PT-LP

PT-LP represents the principal side of an LP position. It is minted one-for-one against `depositedValue` and burned at maturity redemption.

## YT-LP

YT-LP represents the fee stream. The current implementation mints YT proportional to deposited value and time to maturity:

```text
ytAmount = depositedValue * secondsToMaturity / 365 days
```

Fees routed through `afterSwap` accrue into a cumulative fee index. Claims are proportional to the LP's YT balance.

## Fee Routing

Current split:

- 80% to YT-LP holders
- 20% to insurance reserve

This is intentionally simple for demo and testability. The production hook can make this configurable per pool.

## IL Coverage

`ILMath` computes IL from reference and current sqrt prices:

```text
k = (sqrtPriceCurrent / sqrtPriceReference)^2
LP value vs hold = 2 * sqrt(k) / (1 + k)
IL = 1 - LP value vs hold
```

`InsuranceVault` pays the lesser of requested IL and available reserve.

## Premium Quoting

`PremiumMath` estimates premium basis points from volatility, time to maturity, and reserve health. It is capped at 30%.

## Demo Assumptions

- Deposit value is represented as an 18-decimal accounting value.
- Token transfer custody is not implemented yet.
- Uniswap V4 `BaseHook` callback integration is the next production milestone.

