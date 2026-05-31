# StructuredYield Pitch Deck

## Slide 1 — Problem

**LP returns are not fixed income.**

- Uniswap LPs can earn fees and still lose money after impermanent loss.
- Fixed-income capital wants predictable return profiles.
- LP positions are powerful, but too volatile for conservative yield users.

Speaker note:

"DeFi has yield, but much of it is variable and path-dependent. LPs need a way to separate principal certainty from fee speculation."

## Slide 2 — Solution

**Split each LP position into principal and yield.**

- PT-LP: principal claim, redeemable at maturity.
- YT-LP: tradable fee-stream exposure.
- Insurance reserve: covers IL shortfall up to available reserve.

Speaker note:

"StructuredYield makes LP risk legible. Conservative users hold PT-LP; yield seekers buy YT-LP."

## Slide 3 — Mechanism

**Native V4 hook lifecycle.**

```text
Deposit LP value
  -> record reference sqrtPrice
  -> mint PT-LP + YT-LP
  -> route swap fees to YT/reserve
  -> compute IL on withdrawal
  -> vault pays coverage
  -> maturity redemption
```

Speaker note:

"The mechanism relies on pool state and hook callbacks, not an external oracle."

## Slide 4 — Demo

**Dashboard walkthrough.**

- Deposit $50K ETH/USDC.
- Show PT/YT split.
- Show fixed APY and YT fee APY.
- Show IL coverage status.
- Show maturity timeline and active positions.

Speaker note:

"The demo UI visualizes the exact lifecycle users care about: principal, yield, risk, and maturity."

## Slide 5 — Market

**Bring structured yield into Uniswap liquidity.**

- Pendle proved demand for yield splitting.
- Uniswap V4 hooks make LP-native structuring possible.
- Target users: LPs, fixed-income desks, yield traders, vault builders.

Speaker note:

"StructuredYield is the primitive for fixed-income LP capital and speculative fee markets on top of Uniswap V4."

