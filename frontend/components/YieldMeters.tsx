import { YieldMeter } from "@/components/YieldMeter";
import { DEMO_POSITIONS } from "@/lib/demo";

export function YieldMeters() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <h2 className="font-semibold text-white">Yield Distribution by Pool</h2>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {DEMO_POSITIONS.map((position) => (
          <div key={position.poolId} className="space-y-4">
            <p className="text-sm font-semibold text-zinc-300">{position.poolName}</p>
            <YieldMeter label="Fee APY" value={position.feeApy} max={30} />
            <YieldMeter label="Fixed APY" value={Number(position.estimatedFixedAPY) / 100} max={15} />
            <YieldMeter label="IL covered" value={Number(position.currentILBps) / 100} max={6} />
          </div>
        ))}
      </div>
    </section>
  );
}
