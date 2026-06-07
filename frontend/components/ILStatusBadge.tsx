export function ILStatusBadge({ isVaultSolvent, currentILAmount }: { isVaultSolvent: boolean; currentILAmount?: bigint }) {
  const emptyVaultRisk = !isVaultSolvent && (currentILAmount ?? 0n) === 0n;
  const label = isVaultSolvent ? "Covered" : emptyVaultRisk ? "At Risk" : "Partial";
  const className = isVaultSolvent
    ? "bg-[#4ade80]/10 text-[#4ade80]"
    : emptyVaultRisk
      ? "bg-[#f87171]/10 text-[#f87171]"
      : "bg-[#d4a853]/10 text-[#d4a853]";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
