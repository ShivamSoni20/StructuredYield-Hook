"use client";

import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { usePoolState } from "@/hooks/usePoolState";
import { useRealV4Swap } from "@/hooks/useRealV4Swap";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { DEFAULT_POOL_ID, SY_ROUTER, USDC_ADDRESS, USE_REAL_V4, WETH_ADDRESS } from "@/lib/contracts";
import { parseDepositAmount } from "@/lib/math";

export function LiveV4Panel() {
  const [swapAmount, setSwapAmount] = useState("0.01");
  const [swapError, setSwapError] = useState<string | null>(null);
  const amountIn = useMemo(() => parseDepositAmount(swapAmount, 6), [swapAmount]);
  const pool = usePoolState(DEFAULT_POOL_ID);
  const usdcBalance = useTokenBalance(USDC_ADDRESS);
  const wethBalance = useTokenBalance(WETH_ADDRESS);
  const usdcApproval = useTokenApproval(USDC_ADDRESS, amountIn);
  const swap = useRealV4Swap();

  const handleSwap = () => {
    setSwapError(null);
    const currentUsdcBalance = (usdcBalance.data as bigint | undefined) ?? 0n;
    
    if (currentUsdcBalance < amountIn) {
      setSwapError(`Insufficient USDC balance. Need ${swapAmount} USDC, wallet has ${formatUnits(currentUsdcBalance, 6)} USDC.`);
      return;
    }
    
    if (!usdcApproval.approved) {
      setSwapError("USDC not approved. Click Approve USDC first.");
      return;
    }
    
    swap.swapExactInput(amountIn, true, (msg) => setSwapError(msg));
  };

  const slot0 = pool.slot0.data as readonly [bigint, number, number, number] | undefined;
  const liquidity = (pool.liquidity.data as bigint | undefined) ?? 0n;

  if (!USE_REAL_V4) {
    return (
      <section className="rounded-2xl border border-[#d4a853]/20 bg-[#111318] p-5">
        <h2 className="font-semibold text-white">Live V4 Integration</h2>
        <p className="mt-2 text-sm text-zinc-500">Set `NEXT_PUBLIC_V4_HOOK_ADDRESS` to enable the live Unichain Sepolia pool controls.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#4ade80]/10 px-3 py-1 text-xs font-semibold text-[#4ade80]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
            Real Unichain Sepolia V4 Pool
          </p>
          <h2 className="mt-3 font-semibold text-white">USDC/WETH StructuredYield Pool</h2>
          <p className="mt-1 break-all font-mono text-xs text-zinc-500">{DEFAULT_POOL_ID}</p>
        </div>
        <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-3 lg:min-w-[420px]">
          <Stat label="Liquidity" value={liquidity.toLocaleString()} />
          <Stat label="Tick" value={slot0 ? String(slot0[1]) : "Loading"} />
          <Stat label="LP Fee" value={slot0 ? `${slot0[3] / 10_000}%` : "Loading"} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white">Wallet balances</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="USDC" value={formatUnits((usdcBalance.data as bigint | undefined) ?? 0n, 6)} />
            <Row label="WETH" value={formatUnits((wethBalance.data as bigint | undefined) ?? 0n, 18)} />
            <Row label="Router" value={`${SY_ROUTER.address.slice(0, 6)}...${SY_ROUTER.address.slice(-4)}`} />
          </dl>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-zinc-500 mb-2">Need testnet WETH for adding liquidity?</p>
            <button 
              onClick={async () => {
                if (typeof window !== "undefined" && window.ethereum) {
                  try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    await window.ethereum.request({
                      method: 'eth_sendTransaction',
                      params: [{
                        from: accounts[0],
                        to: WETH_ADDRESS,
                        data: "0xd0e30db0", // deposit() selector
                        value: "0x11C37937E08000" // 0.005 ETH
                      }]
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
              className="w-full rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
            >
              Wrap 0.005 ETH to WETH
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white">Real swap test</h3>
          <p className="mt-1 text-xs text-zinc-500">Swaps USDC to WETH through `SYRouter.swapExactInputSingle`, triggering `afterSwap` fee routing.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={swapAmount}
              onChange={(event) => setSwapAmount(event.target.value)}
              inputMode="decimal"
              className="min-h-11 flex-1 rounded-xl border border-white/10 bg-[#0a0b0d] px-3 text-sm text-white outline-none focus:border-[#d4a853]"
              aria-label="USDC swap amount"
            />
            {!usdcApproval.approved ? (
              <button
                type="button"
                disabled={amountIn === 0n || usdcApproval.isLoading}
                onClick={usdcApproval.approve}
                className="min-h-11 rounded-xl border border-[#d4a853]/25 px-4 font-semibold text-[#d4a853] hover:bg-[#d4a853]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usdcApproval.isLoading ? "Approving..." : "Approve USDC"}
              </button>
            ) : (
              <button
                type="button"
                disabled={amountIn === 0n || swap.isLoading}
                onClick={handleSwap}
                className="min-h-11 rounded-xl bg-[#d4a853] px-4 font-semibold text-[#0a0b0d] hover:bg-[#f0c878] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {swap.isLoading ? "Swapping..." : `Swap ${swapAmount} USDC → WETH`}
              </button>
            )}
          </div>
          {swap.hash ? (
            <p className="mt-3 break-all font-mono text-xs text-zinc-500">
              Tx:{" "}
              <a
                href={`https://unichain-sepolia.blockscout.com/tx/${swap.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#d4a853] underline decoration-[#d4a853]/40 underline-offset-4 hover:text-[#f0c878]"
              >
                {swap.hash}
              </a>
            </p>
          ) : null}
          {swap.isSuccess ? <p className="mt-2 text-xs font-semibold text-[#4ade80]">Swap confirmed. Fee routing updated on-chain.</p> : null}
          {swapError ? <p className="mt-2 text-xs text-[#f87171]">{swapError}</p> : null}
          {!swapError && (swap.error || usdcApproval.error) ? <p className="mt-2 text-xs text-[#f87171]">Wallet transaction failed or was rejected.</p> : null}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      <p className="mt-1 font-mono font-semibold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-100">{value}</dd>
    </div>
  );
}
