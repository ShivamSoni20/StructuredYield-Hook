import { formatCurrency } from "@/lib/math";

type Props = {
  reserve: bigint;
  liability: bigint;
  isSolvent: boolean;
};

export function VaultSolvencyCard({ reserve, liability, isSolvent }: Props) {
  const coverage = liability === 0n ? 100 : Math.min(100, Math.round((Number(reserve) / Number(liability)) * 100));

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">Insurance Vault Status</h2>
          <p className="mt-1 text-sm text-zinc-500">Reserve coverage for current IL liability.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSolvent ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#f87171]/10 text-[#f87171]"}`}>
          {isSolvent ? "Solvent" : "Underfunded"}
        </span>
      </div>
      <dl className="mt-6 grid gap-3 text-sm">
        <Row label="Reserve" value={formatCurrency(reserve)} />
        <Row label="Current liability" value={formatCurrency(liability)} />
        <Row label="Coverage" value={`${coverage}% of current IL`} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-100">{value}</dd>
    </div>
  );
}
