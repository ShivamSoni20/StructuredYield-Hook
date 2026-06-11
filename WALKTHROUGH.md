# StructuredYield Project Walkthrough

Last updated: June 11, 2026

## Overview

StructuredYield is a Uniswap V4 hook project that turns AMM LP positions into fixed-income style liquidity products.

The core idea:

- **PT-LP**: principal token representing the LP’s principal claim.
- **YT-LP**: yield token representing the swap-fee stream.
- **Insurance reserve**: per-pool reserve accounting for impermanent-loss protection.
- **V4 hook lifecycle**: mint, fee-route, cover IL, claim fees, and redeem through hook callbacks.
- **Frontend app**: wallet-gated dashboard for live Unichain Sepolia interaction, demo fallback data, pool views, and structured liquidity actions.

The project now includes contracts, V4 adapter, router/lens periphery, tests, deployment scripts, subgraph scaffold, a RainbowKit/Wagmi frontend, Unichain Sepolia deployment records, live swap proof, and demo/submission documentation.

## Current Status

The project is demoable.

Working today:

- Landing page with wallet connection.
- Wallet-gated dashboard.
- RainbowKit + Wagmi wallet flow.
- Real Unichain Sepolia network configuration.
- Dedicated dashboard tabs for Portfolio, Positions, Markets, Add Liquidity, Trade YT-LP, Redeem, and Settings.
- Separate **New Position** and **Add Liquidity** flows.
- Real V4 pool panel showing pool state, balances, approvals, and swap action.
- Live V4 add-liquidity and swap paths through `SYRouter`.
- PT/YT token lifecycle in the hook accounting core.
- Foundry unit/integration/fork tests.
- Next.js production build.

Important note:

- The deployed Unichain Sepolia contracts are live demo contracts.
- The latest local source includes additional fixes such as pending-fee lens reads and active-position overwrite protection.
- Those latest contract fixes need a fresh redeploy before they are reflected in the live Unichain Sepolia addresses.

## Repository Structure

```text
contracts/
  src/
    StructuredYieldHook.sol
    StructuredYieldV4Hook.sol
    accounting/
    math/
    periphery/
    tokens/
    vault/
  script/
  test/

frontend/
  app/
  components/
  hooks/
  lib/

subgraph/
  schema.graphql
  subgraph.yaml
  src/mappings.ts

docs/
demo/
README.md
WALKTHROUGH.md
```

## Contract Progress

Implemented contracts:

- `StructuredYieldHook.sol`
  - Pool initialization.
  - PT/YT minting.
  - Position accounting.
  - Fee routing.
  - Premium quote math.
  - Maturity-gated IL coverage.
  - Fee claims.
  - PT/YT burn and position closure.
- `StructuredYieldV4Hook.sol`
  - Real Uniswap V4 `IHooks` adapter.
  - Uses V4 `PoolKey` / `PoolId`.
  - Calls inherited core accounting methods directly.
  - Supports V4 lifecycle callbacks.
- `PTToken.sol`
  - Hook-only mint/burn token for principal claims.
- `YTToken.sol`
  - Hook-only mint/burn token for yield/fee claims.
- `YieldAccounting.sol`
  - Cumulative fee index.
  - Per-LP snapshots.
  - Claimed fee tracking.
  - Pending claimable fee quote.
- `InsuranceVault.sol`
  - Per-pool reserve ledger.
  - Capped IL payout accounting.
- `VolatilityOracle.sol`
  - Rolling volatility observation.
  - Symmetric basis-point delta behavior.
- `ILMath.sol`
  - Impermanent-loss quote helpers.
- `PremiumMath.sol`
  - Premium calculation from volatility, time to maturity, and reserve ratio.
- `SYRouter.sol`
  - Scaffold-mode router functions.
  - Production-mode V4 `PoolManager.unlock` flows.
  - Real `modifyLiquidity` path.
  - Real `swap` path.
  - Scaffold mode guard.
- `SYLens.sol`
  - Aggregates frontend position reads.
  - Reports PT/YT balances, IL, maturity, APY, solvency, active status, and pending fees.

## V4 Hook Integration

`StructuredYieldV4Hook` implements the V4 hook surface and keeps the accounting core reusable.

Enabled callback coverage:

- `afterInitialize`
  - Initializes StructuredYield pool state for the V4 pool.
  - Creates PT/YT token lifecycle state.
- `beforeAddLiquidity`
  - Reads LP/deposit metadata from hook data.
  - Mints PT/YT claims.
- `afterSwap`
  - Estimates fee routing from swap delta and pool fee.
  - Routes fees to YT accounting and insurance reserve.
- `beforeRemoveLiquidity`
  - Enforces maturity.
  - Quotes and covers IL from reserve accounting.
- `afterRemoveLiquidity`
  - Claims remaining fees.
  - Burns PT/YT.
  - Closes the position.

Router V4 flow:

- `SYRouter.addLiquidityToPool`
  - Calls V4 `PoolManager.modifyLiquidity` through unlock.
  - Passes LP and deposit metadata to the hook.
- `SYRouter.swapExactInputSingle`
  - Calls V4 `PoolManager.swap` through unlock.
  - Triggers `StructuredYieldV4Hook.afterSwap`.
- `SYRouter.removeLiquidityFromPool`
  - Calls V4 remove liquidity path.
  - Triggers maturity-time settlement.

## Frontend Progress

Implemented frontend:

- Next.js App Router.
- Tailwind UI styling.
- RainbowKit wallet UI.
- Wagmi contract reads/writes.
- Unichain Sepolia chain support.
- Configurable RPC through `NEXT_PUBLIC_UNICHAIN_RPC_URL`.
- Wallet-gated dashboard with redirect flow:
  - Disconnected users stay on landing.
  - Connected users can access dashboard.
  - Disconnect redirects back to landing.
- Dashboard layout:
  - Fixed top wallet bar.
  - Desktop sidebar.
  - Mobile bottom-style navigation behavior.
  - Responsive content sections.
- Pages/routes:
  - `/`
  - `/dashboard`
  - `/markets`
  - `/positions`
  - `/positions/[id]`

Dashboard tabs:

- **Portfolio**
  - Metrics grid.
  - Live V4 panel.
  - Fee chart.
  - Maturity timeline.
  - Yield meters.
  - Position table.
- **My Positions**
  - Active PT/YT positions.
- **Markets**
  - Market browsing page.
  - Pool list.
  - Market details.
- **Add Liquidity**
  - Dedicated add-liquidity page.
  - Separate from Markets.
  - Shows existing pool funding flow.
  - Includes live V4 pool panel.
  - Opens add-liquidity modal.
- **Trade YT-LP**
  - Live V4 swap panel.
  - USDC approval.
  - USDC to WETH test swap.
- **Redeem PT-LP**
  - Routes user to position redemption flow.
- **Settings**
  - Contract/env notes and current limitation messaging.

## Wallet Flow

Wallet connection is integrated with RainbowKit and Wagmi.

Behavior:

- Landing page shows wallet connection instead of an unrestricted dashboard shortcut.
- After connecting, the app redirects to `/dashboard`.
- Dashboard and positions are protected by `WalletRouteGuard`.
- Disconnected users are redirected to landing.
- Dashboard wallet button shows connected wallet state.

## New Position vs Add Liquidity

This was recently cleaned up.

Current behavior:

- `+ New Position`
  - Opens the guided new-position modal.
  - Lets the user choose a pool.
  - Creates a structured PT/YT position.
- `Add Liquidity`
  - Opens a dedicated dashboard tab.
  - Does not reuse the Markets page.
  - Shows existing pool funding controls.
  - Pool-specific buttons open add-liquidity modal.
- `Markets`
  - Stays a market browsing page.
  - No longer doubles as the Add Liquidity page.

Modal improvements:

- Visible close `X`.
- Cancel button.
- Escape key closes.
- Backdrop click closes.
- Body scroll is locked while modal is open.
- Modal content is scrollable.
- Sticky footer keeps action buttons reachable.
- Approval buttons are token-specific:
  - `USDC Approved`
  - `WETH Approved`

## Live V4 Panel

The live V4 panel includes:

- Real pool ID.
- V4 liquidity.
- Current tick.
- LP fee display.
- Wallet USDC balance.
- Wallet WETH balance.
- Router address.
- USDC approval button.
- Real swap test button.

Swap behavior:

- Calls `SYRouter.swapExactInputSingle`.
- Uses the real V4 pool key.
- Triggers V4 `afterSwap`.
- Routes fees to YT accounting and insurance reserve.

## Unichain Sepolia Deployment

Network:

| Item | Value |
|---|---|
| Network | Unichain Sepolia |
| Chain ID | `1301` |
| Public RPC | `https://sepolia.unichain.org` |
| Explorer | `https://unichain-sepolia.blockscout.com` |
| Blockscout API | `https://unichain-sepolia.blockscout.com/api` |
| PoolManager | `0x00B036B58a818B1BC34d502D3fE730Db729e62AC` |
| StateView | `0xc199F1072a74D4e905ABa1A84d9a45E2546B6222` |
| WETH | `0x4200000000000000000000000000000000000006` |
| USDC | `0x31d0220469e10c4E71834a79b1f276d740d3768F` |

Live deployed addresses:

| Contract | Address |
|---|---|
| `StructuredYieldV4Hook` | `0x7d68F662E056706476A04AD9CFca3740CaaeDb40` |
| `SYRouter` | `0x6bd6903B652a2E37Fc189e7b3a1DEa2d6Bb77D63` |
| `SYLens` | `0x6866ba266A127c13a2A6DD5877f7F229a75886c9` |
| `InsuranceVault` | `0xe948E1EbEa6bff1cA9ED2b4552D2AA3463bc1f5D` |
| `VolatilityOracle` | `0x7a974055Bf12972c21E99040e4F77e0963a27904` |
| `YieldAccounting` | `0x0E574050055A9cb5c916a4D68e495DB48DC96900` |

Real V4 pool:

| Item | Value |
|---|---|
| Pool ID | `0x92b0899e642ee283b7673bfb931c1e44bb7c2a00c18cc1862d11d743dd8849e4` |
| PTToken | `0x5C0a7288f5C683c41158FADDacF62Be0Aa10E1Fe` |
| YTToken | `0x58531ED94d587fe232C9e536Ba82ED27371A8Efb` |
| Maturity | 90 days from pool initialization |
| Current V4 liquidity | `1,000,000` test liquidity units |

Live transaction proof:

| Action | Transaction |
|---|---|
| Hook deploy | `0xa426400ad4a50493e107484b16b63bb017486ddb79080952b942540fe6e16069` |
| Router deploy | `0xaa2fa80feb49ace804e5cb2c97041142bba5757bd8fbcf81bea6b26e6f7069b8` |
| Lens deploy | `0x2584bf0394b39d34353400acce818207d3c36039cb021c3f6f3c9bc650c769d0` |
| Pool initialize | `0x96d036fe6a7ca3c1de93e1c4dba797116c6f9f068951187a73c5f1662e82dc5d` |
| Wrap ETH to WETH | `0x751e5c62046d2f8a332c811995bd83e0a63c12585e6f3545f1d79b4eac9e6bad` |
| Approve WETH | `0xac361b8f8965b5e01667fc603d99a53ca72e6abe8a21b77ac1ba139f33210c10` |
| Approve USDC | `0xd0c6507659f366a54a70bf1fad89080d1af6555ed79fda13c3acbfa0a662a68b` |
| Add real V4 liquidity | `0x3d3170c502e36cc7ad092695107ad85d32b42fd9b59cffaad776849d8b749680` |
| Real V4 swap / fee routing | `0xda4cd759a5f9d75287e193d965600eef6f3f873ca0b16cf2069cb888f58d09fb` |

Live swap proof:

- Swap amount: `0.01 USDC`.
- Swap path: USDC to WETH.
- Called `SYRouter.swapExactInputSingle`.
- Triggered Uniswap V4 `Swap`.
- Triggered `StructuredYieldV4Hook.afterSwap`.
- Accrued `24` fee units to YT holders.
- Routed `6` fee units to insurance reserve.

## Frontend Environment

Frontend environment values:

```bash
NEXT_PUBLIC_STRUCTURED_YIELD_HOOK=0x7d68F662E056706476A04AD9CFca3740CaaeDb40
NEXT_PUBLIC_V4_HOOK_ADDRESS=0x7d68F662E056706476A04AD9CFca3740CaaeDb40
NEXT_PUBLIC_SY_ROUTER=0x6bd6903B652a2E37Fc189e7b3a1DEa2d6Bb77D63
NEXT_PUBLIC_SY_LENS=0x6866ba266A127c13a2A6DD5877f7F229a75886c9
NEXT_PUBLIC_INSURANCE_VAULT=0xe948E1EbEa6bff1cA9ED2b4552D2AA3463bc1f5D
NEXT_PUBLIC_REAL_POOL_ID=0x92b0899e642ee283b7673bfb931c1e44bb7c2a00c18cc1862d11d743dd8849e4
NEXT_PUBLIC_CHAIN_ID=1301
NEXT_PUBLIC_UNICHAIN_RPC_URL=https://sepolia.unichain.org
NEXT_PUBLIC_SUBGRAPH_URL=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

The RPC can be replaced with an Alchemy/QuickNode Unichain Sepolia RPC if the public endpoint is slow.

## Subgraph Progress

Implemented:

- `subgraph/schema.graphql`.
- `subgraph/src/mappings.ts`.
- `subgraph/subgraph.yaml`.

Entities:

- `Position`.
- `FeeRoute`.
- `ILCoverage`.

Event handlers:

- `PTYTMinted`.
- `FeesRouted`.
- `ILCovered`.
- `PositionClosed`.

Current status:

- Configured for Unichain Sepolia.
- Hook address is set to the live hook.
- `startBlock` is set near the known deployment area.
- Subgraph deployment is still a remaining task.
- Fee chart falls back to demo data if `NEXT_PUBLIC_SUBGRAPH_URL` is not configured or returns no data.

## Tests and Validation

Frontend:

- `npm.cmd run build` passes.
- The app serves locally on `http://localhost:3000`.
- Known build warnings are from optional RainbowKit/WalletConnect dependencies:
  - `@react-native-async-storage/async-storage`
  - `pino-pretty`
- These warnings do not currently block the build.

Contracts:

- Foundry test suite passes locally.
- Latest recorded result: `40 passed, 0 failed`.

Covered areas:

- PT token behavior.
- YT token behavior.
- Hook mint/redeem lifecycle.
- Fee routing.
- IL coverage.
- Real USDC vault custody.
- Disabled YT transfers.
- Premium/volatility math.
- Router scaffold guards.
- Lens position view.
- V4 permission tests.
- V4 integration tests.
- Full deposit → swap → claim → mature → redeem flow.

Server:

- Local production server has been started on `http://localhost:3000`.
- Health check returned HTTP `200`.

## Demo Flow

Recommended demo path:

1. Open `http://localhost:3000`.
2. Connect wallet on Unichain Sepolia.
3. App redirects to `/dashboard`.
4. Show Portfolio overview.
5. Open **Add Liquidity** tab.
6. Show that it is separate from **Markets**.
7. Use Add Liquidity modal.
8. Show token-specific approvals.
9. Use Trade YT-LP / Live V4 panel for real swap demo.
10. Show position table and claim/redeem UI.
11. Explain that maturity redemption on testnet is gated by 90-day maturity.

## What Is Fully Working

Working:

- Contract scaffold lifecycle.
- V4 hook adapter.
- V4 pool deployment.
- V4 pool initialization.
- Real V4 liquidity add.
- Real V4 swap.
- Fee routing from real V4 swap.
- Frontend wallet connection.
- Dashboard route protection.
- Live V4 pool reads.
- ERC-20 approval UX.
- Dedicated Add Liquidity tab.
- New Position modal.
- Add Liquidity modal.
- Live vault solvency panel.
- Swap slippage protection.
- Responsive dashboard UI.
- Demo fallback data.
- Build and tests.

## What Is Partially Working

Partially working:

- Fee chart:
  - Live-ready through subgraph hook.
  - Still needs deployed subgraph URL.
- Claim fees:
  - Hook path is implemented.
  - Live UI can call claim.
  - The deployed contract may not include the latest local pending-fee lens improvement until redeploy.
- Redeem:
  - Contract flow works.
  - Live Sepolia pool is maturity-gated for 90 days.
  - Demo/test redemption works through tests or local time manipulation.
- Liquidity sizing:
  - Improved from a flat test delta to a price-aware approximation.
  - Still needs exact V4 token-delta math before production.

## Known Limitations

Main limitations:

- Latest local `InsuranceVault` supports real USDC custody through `fundWithTokens`, but live testnet addresses need redeploy/funding to expose it.
- YT transfers are disabled in the current implementation to keep fee ownership deterministic.
- Liquidity math is still an approximation for demo/testnet.
- Swap slippage bounds are implemented; add-liquidity exact token-delta/min-out protection is still a production task.
- Current live pool is a test pool, not a production-priced USDC/WETH market.
- Subgraph is scaffolded but not confirmed deployed.
- Latest local contract fixes need redeployment to reflect on Unichain Sepolia.

## Security and Production Notes

Current security posture:

- Unit/integration/fork tests pass.
- V4 callback selector dispatch issue was fixed by using inherited `super` calls.
- Maturity guard is placed before IL payout.
- Premium reserve-ratio math was corrected.
- Volatility delta calculation was made symmetric.
- Scaffold router calls are guarded by `isScaffoldMode`.
- Insurance vault token custody uses real USDC transfers and a non-reentrant payout path.
- YT transfers are disabled to avoid incorrect fee ownership after secondary transfers.

Remaining before production:

- Run Slither and fix High/Critical findings.
- Redeploy and fund the latest vault on Unichain Sepolia.
- Add exact V4 quote/liquidity math and add-liquidity min-out limits.
- Add gas snapshots.
- Add more fuzz/invariant tests.
- Redeploy latest contracts and update frontend/subgraph addresses.

## Commands

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Production-style local server:

```bash
cd frontend
npm run build
npm run start
```

Contracts:

```bash
cd contracts
forge test -vvv
```

Deploy scaffold contracts:

```bash
cd contracts
cp .env.example .env
# fill PRIVATE_KEY
source .env

forge script script/Deploy.s.sol \
  --rpc-url unichain_sepolia \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://unichain-sepolia.blockscout.com/api \
  -vvvv
```

Deploy/mine V4 hook:

```bash
cd contracts
source .env

forge script script/MineAndDeployV4Hook.s.sol \
  --rpc-url unichain_sepolia \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://unichain-sepolia.blockscout.com/api \
  -vvvv
```

Initialize V4 pool:

```bash
V4_HOOK_ADDRESS=<hook_address> \
forge script script/InitializeV4Pool.s.sol \
  --rpc-url unichain_sepolia \
  --broadcast \
  -vvvv
```

Trigger test swap:

```bash
V4_HOOK_ADDRESS=<hook_address> \
SY_ROUTER=<router_address> \
SWAP_AMOUNT_IN=10000 \
ZERO_FOR_ONE=true \
forge script script/TriggerTestSwap.s.sol \
  --rpc-url unichain_sepolia \
  --broadcast \
  -vvvv
```

Fund insurance vault with real USDC:

```bash
INSURANCE_VAULT=<deployed_vault_address> \
POOL_ID=<pool_id> \
FUND_AMOUNT_USDC=10000000 \
forge script script/FundVault.s.sol \
  --rpc-url unichain_sepolia \
  --broadcast \
  -vvvv
```

## Next Steps

Highest priority:

1. Redeploy latest contracts so live addresses include real USDC vault custody, disabled YT transfers, maturity-bound pool setup, and pending-fee lens reads.
2. Deploy the Unichain Sepolia subgraph and set `NEXT_PUBLIC_SUBGRAPH_URL`.
3. Replace simplified liquidity sizing with exact V4 token-delta math.
4. Add add-liquidity min-out protection and exact quote previews.
5. Fund the live `InsuranceVault` with USDC and verify solvency in the UI.
6. Re-run Slither and gas snapshots.
7. Record a final demo video showing wallet connect, dashboard, add liquidity, live swap, and claim/redeem status.

## Summary

StructuredYield has moved from a scaffold into a real Uniswap V4/Unichain Sepolia demo:

- Core hook mechanics are implemented.
- Real V4 callbacks are integrated.
- Real PoolManager liquidity and swap paths work.
- The frontend is wallet-gated and live-aware.
- Add Liquidity, Markets, New Position, and Trade flows are separated.
- Tests and build pass.

The main remaining work is production hardening: exact liquidity math, subgraph deployment, live vault funding, security scans, and redeploying the latest local contract fixes.
