# StructuredYield 2-Minute Demo Script

## 0:00-0:15 — Problem

"Uniswap LPs earn fees, but returns are unpredictable because impermanent loss can overwhelm those fees. That makes LP positions hard to use as fixed-income collateral."

## 0:15-0:35 — Solution

"StructuredYield turns one LP position into two instruments: PT-LP for principal and YT-LP for fee yield. PT holders get a fixed-return style asset. YT holders get amplified exposure to trading fees."

## 0:35-1:05 — Landing Page

Open `http://localhost:3000`.

Show:

- PT/YT split card
- Fixed APY and variable yield rows
- Insurance reserve status
- Hook mechanism flow

Narration:

"The user deposits liquidity once. The hook records a reference price, mints PT-LP and YT-LP, routes fees to YT holders, and uses a reserve to cover IL at maturity."

## 1:05-1:35 — Dashboard

Click "Open App".

Show:

- TVL
- Average fixed APY
- YT fees earned
- IL protected
- Maturity timeline
- Active positions table

Narration:

"The dashboard tracks principal, fee yield, IL coverage, and upcoming maturity. This is currently connected to the frontend shell and contract ABI config, with demo data until deployed addresses are supplied."

## 1:35-1:55 — Contract Walkthrough

Show these files:

- `contracts/src/StructuredYieldHook.sol`
- `contracts/src/math/ILMath.sol`
- `contracts/src/vault/InsuranceVault.sol`
- `contracts/src/accounting/YieldAccounting.sol`

Narration:

"The contract scaffold implements the lifecycle: mint PT/YT on deposit, route fees, compute IL from sqrt price, cap payouts by vault reserve, and settle positions at maturity."

## 1:55-2:00 — Close

"StructuredYield brings Pendle-style fixed income directly into Uniswap V4 LP positions: composable, oracle-light, and designed around native hook callbacks."

