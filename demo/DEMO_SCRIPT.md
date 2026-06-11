# StructuredYield 2-Minute Demo Script

## 0:00-0:15 — Problem

"Uniswap LPs earn fees, but returns are unpredictable because impermanent loss can overwhelm them. StructuredYield solves this by splitting LP exposure into PT-LP for principal and YT-LP for the fee stream."

## 0:15-0:45 — Live Proof

Open:

```text
https://unichain-sepolia.blockscout.com/tx/0xda4cd759a5f9d75287e193d965600eef6f3f873ca0b16cf2069cb888f58d09fb
```

Point out:

- V4 `Swap` event in the logs.
- `StructuredYieldV4Hook.afterSwap` was called.
- Fee routing sent `24` units to YT holders and `6` units to the insurance reserve.
- This is a real Unichain Sepolia transaction, not a simulation.

"A real USDC swap went through Uniswap V4 PoolManager, our hook intercepted the `afterSwap` callback, and fees were routed to YT holders automatically."

## 0:45-1:15 — Landing Page

Open:

```text
http://localhost:3000
```

Show:

- PT/YT split card.
- Mechanism flow.
- Insurance reserve status.
- Hook lifecycle explanation.

"Connect wallet on Unichain Sepolia to see real positions and live pool state."

## 1:15-1:45 — Dashboard

Connect MetaMask on Unichain Sepolia. The app auto-redirects to `/dashboard`.

Show:

- Live/demo badge in the metrics grid.
- Live V4 pool ID, liquidity, tick, and fee.
- Wallet USDC/WETH balances.
- Real V4 swap panel.
- Real position data from `SYLens` when the connected wallet has an active position.

## 1:45-2:00 — Close

"StructuredYield implements the complete UHI9 fixed-income lifecycle on Uniswap V4: deposit, PT/YT split, fee routing, IL coverage, and maturity redemption. The live Unichain Sepolia swap proves the hook is running through real V4 callbacks."

## Demo-Day Checklist

1. MetaMask configured for Unichain Sepolia: chain `1301`, RPC `https://sepolia.unichain.org`.
2. `frontend/.env.local` includes the live hook, router, lens, pool ID, and chain ID.
3. `npm run build` passes.
4. Open `http://localhost:3000` and connect wallet.
5. Confirm landing page scroll and wallet redirect flow.
6. Show `/dashboard` live V4 panel.
7. Open `DepositModal` and show "Real V4 mode · Unichain Sepolia" plus approval buttons.
8. Open the live position detail route for pool `0x92b0899e642ee283b7673bfb931c1e44bb7c2a00c18cc1862d11d743dd8849e4`.
9. Show the live Blockscout swap transaction.
10. State accepted limitations clearly: approximate liquidity math,
    vault funding is manual (owner calls fundWithTokens), and subgraph
    not yet deployed to Graph Studio.
