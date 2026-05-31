# StructuredYield Hook — Development Plan
## Phase-by-Phase Roadmap · File Architecture · UI Wiring

> **Hook:** StructuredYield — Fixed Income for Uniswap V4 LPs via PT/YT Splitting  
> **Hackathon:** UHI9 · July 2026 · Theme: Impermanent Loss & Yield Systems  
> **Stack:** Solidity + Foundry (hook) · Next.js 14 + Wagmi v2 + Viem (frontend)

---

## 🗂 Full File Architecture

```
structured-yield-hook/
│
├── index.html                         ← Phase 0: Static landing + dashboard (DONE)
│
├── contracts/                         ← Foundry project root
│   ├── foundry.toml
│   ├── remappings.txt
│   │
│   ├── src/
│   │   ├── StructuredYieldHook.sol    ← CORE: Main hook contract (Phase 1)
│   │   ├── tokens/
│   │   │   ├── PTToken.sol            ← ERC-20: Principal Token (Phase 1)
│   │   │   └── YTToken.sol            ← ERC-20: Yield Token (Phase 1)
│   │   ├── vault/
│   │   │   └── InsuranceVault.sol     ← IL insurance logic (Phase 2)
│   │   ├── accounting/
│   │   │   ├── YieldAccounting.sol    ← Fee routing + YT distribution (Phase 2)
│   │   │   └── VolatilityOracle.sol   ← On-chain vol estimate (Phase 2)
│   │   ├── math/
│   │   │   ├── ILMath.sol             ← IL calculation from sqrtPrice (Phase 2)
│   │   │   └── PremiumMath.sol        ← Dynamic premium computation (Phase 2)
│   │   └── periphery/
│   │       ├── SYRouter.sol           ← User-facing router + multicall (Phase 3)
│   │       └── SYLens.sol             ← Read-only view aggregator (Phase 3)
│   │
│   ├── test/
│   │   ├── unit/
│   │   │   ├── StructuredYieldHook.t.sol
│   │   │   ├── PTToken.t.sol
│   │   │   ├── YTToken.t.sol
│   │   │   ├── InsuranceVault.t.sol
│   │   │   └── ILMath.t.sol
│   │   ├── integration/
│   │   │   ├── FullFlow.t.sol         ← Deposit → swap → mature → redeem
│   │   │   ├── ILCoverage.t.sol       ← 30%/50%/80% IL stress tests
│   │   │   └── FeeRouting.t.sol       ← YT yield distribution test
│   │   └── fork/
│   │       └── UniswapV4Fork.t.sol    ← Mainnet fork test
│   │
│   └── script/
│       ├── Deploy.s.sol               ← Full deployment script
│       └── CreatePool.s.sol           ← Create test pool with hook
│
├── frontend/                          ← Next.js app (Phase 4)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   ← Landing page (wired from index.html)
│   │   ├── dashboard/
│   │   │   └── page.tsx               ← Dashboard (wired from index.html)
│   │   └── positions/
│   │       └── [id]/page.tsx          ← Position detail page
│   ├── components/
│   │   ├── PositionCard.tsx
│   │   ├── PTYTSplitVisual.tsx        ← The split bar visual from landing
│   │   ├── YieldMeter.tsx             ← The yield bars from dashboard
│   │   ├── MaturityTimeline.tsx
│   │   ├── FeeChart.tsx
│   │   └── DepositModal.tsx
│   ├── hooks/                         ← React hooks (not Uniswap hooks)
│   │   ├── usePositions.ts
│   │   ├── useMintPTYT.ts
│   │   ├── useRedeemPT.ts
│   │   └── useInsuranceVault.ts
│   ├── lib/
│   │   ├── contracts.ts               ← ABI + address config
│   │   ├── wagmi.ts                   ← Wagmi + Viem config
│   │   └── math.ts                    ← IL math JS helpers
│   └── public/
│
├── subgraph/                          ← The Graph indexer (Phase 5)
│   ├── schema.graphql
│   ├── subgraph.yaml
│   └── src/
│       └── mappings.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MECHANISM.md
│   └── AUDIT_NOTES.md
│
└── README.md
```

---

## 🗓 5-Phase Development Plan

---

### PHASE 1 — Core Hook Skeleton (Days 1–4)
**Goal:** Working hook that mints PT/YT tokens on LP deposit and redeems on removal. No IL math yet.

#### Deliverables
- [ ] `StructuredYieldHook.sol` — implements `beforeAddLiquidity`, `afterRemoveLiquidity`
- [ ] `PTToken.sol` — ERC-20 with hook-only mint/burn
- [ ] `YTToken.sol` — ERC-20 with hook-only mint/burn
- [ ] Unit tests for mint/burn lifecycle
- [ ] Local deployment on Anvil fork

#### Key Contracts

```solidity
// StructuredYieldHook.sol — Phase 1 skeleton
contract StructuredYieldHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    // Per-pool config
    struct PoolConfig {
        uint256 maturityTimestamp;
        address ptToken;
        address ytToken;
        uint256 insuranceReserve;
        uint256 feeBuffer;
    }

    // Per-LP position tracking
    struct LPPosition {
        uint256 depositedValue;      // USD value at deposit
        uint160 referenceSqrtPrice;  // sqrtPrice at deposit (IL baseline)
        uint256 ptMinted;
        uint256 ytMinted;
        uint256 depositTimestamp;
    }

    mapping(PoolId => PoolConfig) public pools;
    mapping(PoolId => mapping(address => LPPosition)) public positions;

    // Hook flags: which callbacks to activate
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,        // set up pool config
            beforeAddLiquidity: true,     // record reference price + mint PT/YT
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,  // compute IL + trigger vault payout
            afterRemoveLiquidity: true,   // settle YT fees, burn tokens
            beforeSwap: false,
            afterSwap: true,              // route fees to YT holders
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function afterInitialize(
        address, PoolKey calldata key, uint160, int24, bytes calldata data
    ) external override returns (bytes4) {
        (uint256 maturity, uint256 premiumBps) = abi.decode(data, (uint256, uint256));
        PoolId id = key.toId();
        // Deploy PT + YT tokens for this pool
        PTToken pt = new PTToken(address(this));
        YTToken yt = new YTToken(address(this));
        pools[id] = PoolConfig({
            maturityTimestamp: maturity,
            ptToken: address(pt),
            ytToken: address(yt),
            insuranceReserve: 0,
            feeBuffer: 0
        });
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata
    ) external override returns (bytes4) {
        PoolId id = key.toId();
        (, uint160 sqrtPrice,) = poolManager.getSlot0(id);
        uint256 depositValue = _computeDepositValue(params, sqrtPrice);

        positions[id][sender] = LPPosition({
            depositedValue: depositValue,
            referenceSqrtPrice: sqrtPrice,
            ptMinted: depositValue,
            ytMinted: _computeYTAmount(depositValue, pools[id].maturityTimestamp),
            depositTimestamp: block.timestamp
        });

        // Mint PT-LP and YT-LP to depositor
        PTToken(pools[id].ptToken).mint(sender, depositValue);
        YTToken(pools[id].ytToken).mint(sender, positions[id][sender].ytMinted);

        return IHooks.beforeAddLiquidity.selector;
    }
}
```

#### Tests to Write
```bash
# Phase 1 test commands
forge test --match-contract PTTokenTest -vvv
forge test --match-contract StructuredYieldHookTest --match-test testMintOnDeposit -vvv
forge test --match-contract StructuredYieldHookTest --match-test testBurnOnRedeem -vvv
```

---

### PHASE 2 — IL Math + Insurance Vault (Days 5–9)
**Goal:** Complete IL computation, dynamic premium pricing, insurance vault, and fee routing to YT holders.

#### Deliverables
- [ ] `ILMath.sol` — pure IL formula using sqrtPrice ratio
- [ ] `PremiumMath.sol` — rolling volatility estimator (last 50 blocks)
- [ ] `InsuranceVault.sol` — deposit, payout, and solvency check
- [ ] `YieldAccounting.sol` — per-YT-token fee accrual
- [ ] `afterSwap` callback with fee routing
- [ ] Integration test: 30% price move → vault covers IL

#### Key Math

```solidity
// ILMath.sol
library ILMath {
    /// @notice Compute impermanent loss as a fraction of deposit value
    /// @param sqrtPriceRef  sqrtPrice at deposit  (Q64.96)
    /// @param sqrtPriceCurr sqrtPrice at withdrawal (Q64.96)
    /// @return ilBps  IL in basis points (e.g. 150 = 1.50%)
    function computeILBps(
        uint160 sqrtPriceRef,
        uint160 sqrtPriceCurr
    ) internal pure returns (uint256 ilBps) {
        // price ratio k = (sqrtPriceCurr / sqrtPriceRef)^2
        // IL% = 2*sqrt(k)/(1+k) - 1
        // Computed in fixed-point without overflow
        uint256 sqrtK = FullMath.mulDiv(sqrtPriceCurr, 1e18, sqrtPriceRef);
        uint256 k = FullMath.mulDiv(sqrtK, sqrtK, 1e18);
        uint256 numerator = 2 * FullMath.sqrt(k * 1e18);
        uint256 denominator = 1e18 + k;
        uint256 holdValue = FullMath.mulDiv(numerator, 1e18, denominator);
        // IL = 1 - holdValue (where holdValue < 1e18)
        if (holdValue >= 1e18) return 0;
        ilBps = (1e18 - holdValue) * 10000 / 1e18;
    }
}
```

```solidity
// YieldAccounting.sol — simplified reward accounting
contract YieldAccounting {
    // Global fee index: cumulative fees per YT token (Q128)
    mapping(PoolId => uint256) public feeIndex;
    // Per-LP snapshot of index at their last claim
    mapping(PoolId => mapping(address => uint256)) public feeIndexSnapshot;

    function accrueFees(PoolId id, uint256 feeAmount, uint256 totalYTSupply) external {
        if (totalYTSupply == 0) return;
        feeIndex[id] += FullMath.mulDiv(feeAmount, 2**128, totalYTSupply);
    }

    function claimFees(PoolId id, address lp, uint256 ytBalance) 
        external returns (uint256 owed) {
        uint256 delta = feeIndex[id] - feeIndexSnapshot[id][lp];
        owed = FullMath.mulDiv(delta, ytBalance, 2**128);
        feeIndexSnapshot[id][lp] = feeIndex[id];
    }
}
```

#### Stress Test Matrix
| Scenario | Price Move | Expected IL | Vault Coverage |
|---|---|---|---|
| Mild | ±10% | ~0.12% | Full |
| Moderate | ±30% | ~1.37% | Full |
| Severe | ±50% | ~3.76% | Full (if reserve solvent) |
| Extreme | ±80% | ~11.8% | Partial (reserve cap) |

---

### PHASE 3 — Periphery + Deployment (Days 10–13)
**Goal:** Router for clean UX, view lens for frontend queries, testnet deployment.

#### Deliverables
- [ ] `SYRouter.sol` — multicall: deposit + approve + mint in one tx
- [ ] `SYLens.sol` — view functions: positions, IL status, maturity countdown
- [ ] Deploy to Unichain testnet (or Base Sepolia)
- [ ] Verify contracts on Etherscan
- [ ] Fork test against real Uniswap V4 deployment

```solidity
// SYLens.sol — read-only aggregator for frontend
contract SYLens {
    struct PositionView {
        uint256 ptBalance;
        uint256 ytBalance;
        uint256 currentILBps;
        uint256 accruedFees;
        uint256 secondsToMaturity;
        bool isVaultSolvent;
        uint256 estimatedFixedAPY;
    }

    function getPosition(
        PoolKey calldata key,
        address lp
    ) external view returns (PositionView memory view_) {
        // aggregates all state for frontend in 1 call
    }
}
```

---

### PHASE 4 — Frontend Integration (Days 14–18)
**Goal:** Wire the static `index.html` mockup into a fully functional Next.js + Wagmi app.

#### See: **UI Wiring Guide** section below ↓

---

### PHASE 5 — Hardening + Demo Day (Days 19–21)
**Goal:** Security review, gas optimization, demo polish, pitch preparation.

#### Deliverables
- [ ] Slither static analysis pass (zero High/Critical)
- [ ] Gas benchmarks: `forge snapshot`
- [ ] Demo video (2-minute walkthrough)
- [ ] Pitch deck (5 slides: problem → solution → mechanism → demo → market)
- [ ] README with deployment instructions

#### Gas Targets
| Function | Target Gas |
|---|---|
| `beforeAddLiquidity` | < 80,000 |
| `afterSwap` (fee routing) | < 35,000 |
| `beforeRemoveLiquidity` | < 60,000 |
| `afterRemoveLiquidity` (settle) | < 45,000 |

---

## 🔌 UI Wiring Guide: Connecting `index.html` to the Smart Contracts

The static `index.html` file is the complete design reference. Every UI element maps to a specific contract call. Here's the exact wiring.

---

### Setup: Next.js + Wagmi Config

```bash
# Bootstrap
npx create-next-app@latest frontend --typescript --tailwind
cd frontend
npm install wagmi viem @tanstack/react-query
```

```typescript
// frontend/lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { unichain, baseSepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [unichain, baseSepolia],
  connectors: [injected(), walletConnect({ projectId: '...' })],
  transports: {
    [unichain.id]: http(),
    [baseSepolia.id]: http(),
  },
})
```

```typescript
// frontend/lib/contracts.ts
export const STRUCTURED_YIELD_HOOK = {
  address: '0x...' as `0x${string}`,
  abi: [...] // import from contracts/out/StructuredYieldHook.sol/StructuredYieldHook.json
} as const

export const SY_LENS = {
  address: '0x...' as `0x${string}`,
  abi: [...]
} as const
```

---

### Hero Card Wiring

The hero card in `index.html` shows static values. Replace with:

```typescript
// frontend/hooks/usePositions.ts
import { useReadContract, useAccount } from 'wagmi'
import { SY_LENS } from '../lib/contracts'

export function usePosition(poolKey: PoolKey) {
  const { address } = useAccount()
  
  return useReadContract({
    ...SY_LENS,
    functionName: 'getPosition',
    args: [poolKey, address],
    // Returns: { ptBalance, ytBalance, currentILBps, accruedFees,
    //            secondsToMaturity, isVaultSolvent, estimatedFixedAPY }
  })
}
```

```tsx
// frontend/components/PositionCard.tsx
// Maps to the hero-card in index.html

export function PositionCard({ poolKey }: { poolKey: PoolKey }) {
  const { data: position } = usePosition(poolKey)

  return (
    <div className="hero-card">
      {/* card-value → position.ptBalance formatted */}
      <div className="card-value">
        ${formatUnits(position?.ptBalance ?? 0n, 18)}
      </div>

      {/* split-bar widths → ptBalance : ytBalance ratio */}
      <PTYTSplitVisual pt={position?.ptBalance} yt={position?.ytBalance} />

      {/* Fixed APY row → position.estimatedFixedAPY / 100 + "%" */}
      <div className="card-row">
        <span>Fixed APY (PT-LP)</span>
        <span>{(Number(position?.estimatedFixedAPY) / 100).toFixed(1)}%</span>
      </div>

      {/* Maturity row → position.secondsToMaturity → formatted date */}
      <div className="card-row">
        <span>Maturity</span>
        <span>{formatMaturity(position?.secondsToMaturity)}</span>
      </div>
    </div>
  )
}
```

---

### Dashboard Metric Cards Wiring

```typescript
// Each of the 4 metric cards maps to:

// 1. "Total Value Locked" → sum of all ptBalance across positions
// 2. "Avg Fixed APY" → average estimatedFixedAPY from SYLens
// 3. "YT-LP Fees Earned" → sum of accruedFees across positions
// 4. "IL Protected" → sum of vault payouts from InsuranceVault events

// Use useReadContracts for batching:
const { data } = useReadContracts({
  contracts: [
    { ...SY_LENS, functionName: 'getTotalTVL', args: [address] },
    { ...SY_LENS, functionName: 'getAvgFixedAPY', args: [address] },
    { ...SY_LENS, functionName: 'getTotalFeesEarned', args: [address] },
    { ...SY_LENS, functionName: 'getTotalILCovered', args: [address] },
  ]
})
```

---

### Deposit Flow (+ New Position button)

```typescript
// frontend/hooks/useMintPTYT.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { STRUCTURED_YIELD_HOOK } from '../lib/contracts'

export function useMintPTYT() {
  const { writeContract, data: hash } = useWriteContract()
  
  const deposit = (poolKey: PoolKey, amount: bigint, maturityDays: number) => {
    writeContract({
      ...STRUCTURED_YIELD_HOOK,
      functionName: 'deposit',   // calls SYRouter.depositAndMint
      args: [poolKey, amount, BigInt(maturityDays * 86400)],
      value: 0n,
    })
  }

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  return { deposit, isLoading, isSuccess }
}
```

```tsx
// frontend/components/DepositModal.tsx
// Triggered by "+ New Position" button in dashboard

export function DepositModal({ open, onClose }: Props) {
  const { deposit, isLoading } = useMintPTYT()
  const [amount, setAmount] = useState('')
  const [maturity, setMaturity] = useState(90)

  return (
    <dialog open={open}>
      <h2>Add Liquidity + Mint PT/YT</h2>
      
      {/* Pool selector */}
      <select>
        <option>ETH / USDC</option>
        <option>wBTC / USDC</option>
        <option>wstETH / USDC</option>
      </select>

      {/* Amount input */}
      <input value={amount} onChange={e => setAmount(e.target.value)} 
             placeholder="Amount (USDC)" />

      {/* Maturity selector — maps to the 3 hero maturity options */}
      <select value={maturity} onChange={e => setMaturity(+e.target.value)}>
        <option value={30}>30 days</option>
        <option value={90}>90 days</option>
        <option value={180}>180 days</option>
      </select>

      <button onClick={() => deposit(poolKey, parseUnits(amount, 6), maturity)}
              disabled={isLoading}>
        {isLoading ? 'Minting PT/YT...' : 'Deposit & Mint PT/YT →'}
      </button>
    </dialog>
  )
}
```

---

### Yield Meters Wiring

```tsx
// frontend/components/YieldMeter.tsx
// Maps to the .yield-meter elements in the dashboard

export function YieldMeter({ poolKey }: { poolKey: PoolKey }) {
  const { data } = usePosition(poolKey)

  const feeAPY = Number(data?.accruedFees ?? 0) / Number(data?.ptBalance ?? 1) * 365 / daysElapsed * 100
  const fixedAPY = Number(data?.estimatedFixedAPY ?? 0) / 100
  const ilPct = Number(data?.currentILBps ?? 0) / 100

  return (
    <div>
      <YieldBar label="Fee APY" value={feeAPY} max={50} color="teal" />
      <YieldBar label="Fixed APY" value={fixedAPY} max={30} color="gold" />
      <YieldBar label="IL (covered)" value={ilPct} max={15}
                color={ilPct > 5 ? 'red' : 'green'} />
    </div>
  )
}
```

---

### Fee Chart Wiring

```typescript
// frontend/hooks/useFeeHistory.ts
// Replaces the static chart in dashboard with real subgraph data

import { useQuery } from '@tanstack/react-query'

const FEES_QUERY = `
  query FeeHistory($lp: String!) {
    feeEvents(where: { lp: $lp }, orderBy: timestamp, orderDirection: asc) {
      timestamp
      feeAmount
      poolId
    }
  }
`

export function useFeeHistory(address: string) {
  return useQuery({
    queryKey: ['feeHistory', address],
    queryFn: () => fetch(SUBGRAPH_URL, {
      method: 'POST',
      body: JSON.stringify({ query: FEES_QUERY, variables: { lp: address } })
    }).then(r => r.json())
  })
}
```

---

### Event Indexing (Phase 5 → Subgraph)

Key events to index for the dashboard:

```solidity
// In StructuredYieldHook.sol — emit these events:
event PTYTMinted(PoolId indexed poolId, address indexed lp,
                 uint256 ptAmount, uint256 ytAmount, uint256 maturity);
event FeesRouted(PoolId indexed poolId, uint256 ytFees, uint256 insuranceFees);
event ILCovered(PoolId indexed poolId, address indexed lp, uint256 ilAmount);
event PositionClosed(PoolId indexed poolId, address indexed lp,
                     uint256 principal, uint256 totalFees);
```

---

## 📅 Full Timeline

```
Day 1-2   ── Phase 1: Hook setup, PT/YT token contracts
Day 3-4   ── Phase 1: beforeAddLiquidity + afterRemoveLiquidity + unit tests
Day 5-6   ── Phase 2: ILMath.sol + PremiumMath.sol
Day 7-8   ── Phase 2: InsuranceVault + YieldAccounting
Day 9     ── Phase 2: afterSwap fee routing + integration tests
Day 10-11 ── Phase 3: SYRouter + SYLens periphery
Day 12-13 ── Phase 3: Testnet deploy + fork tests
Day 14-15 ── Phase 4: Next.js scaffold + Wagmi config + contract wiring
Day 16-17 ── Phase 4: Dashboard components (metrics, chart, table)
Day 18    ── Phase 4: Deposit modal + full user flow test
Day 19    ── Phase 5: Slither + gas optimization
Day 20    ── Phase 5: Demo video + pitch deck
Day 21    ── Phase 5: README, final polish, submit
```

---

## 🏆 Demo Day Pitch (5 Slides)

**Slide 1 — The Problem**
> "In 2025, LPs lost $60M net after fees in just the sampled Uniswap TVL. 60% were unprofitable. The $150T fixed income market has never touched DeFi because yields are unpredictable."

**Slide 2 — The Solution**
> "StructuredYield splits your V4 LP position into PT-LP (fixed principal, redeemable at maturity) and YT-LP (the fee stream, tradable). LP risk is gone. Yield seekers get amplified exposure."

**Slide 3 — The Mechanism**
> Show the flow: deposit → hook mints PT/YT → swaps route fees to YT → vault covers IL → maturity redeems PT.

**Slide 4 — Live Demo**
> Walk through dashboard: deposit $50K, show PT/YT split, simulate 30% price move, show IL coverage, redeem PT at maturity.

**Slide 5 — Market**
> "Pendle settled $58B in 2025. We bring that primitive natively into Uniswap V4 — composable, oracle-free, on any pool."

---

*StructuredYield · Built for UHI9 Hookathon · Atrium Academy · July 2026*
