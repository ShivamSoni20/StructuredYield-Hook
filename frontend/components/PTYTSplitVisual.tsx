import { formatCurrency } from "@/lib/math";

type Props = {
  pt?: bigint;
  yt?: bigint;
};

export function PTYTSplitVisual({ pt = 0n, yt = 0n }: Props) {
  const total = Number(pt + yt) || 1;
  const ptWidth = Math.max(8, Math.round((Number(pt) / total) * 100));
  const ytWidth = Math.max(8, 100 - ptWidth);

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-label="PT and YT split">
        <div className="bg-[#d4a853]" style={{ width: `${ptWidth}%` }} />
        <div className="bg-[#2dd4bf]" style={{ width: `${ytWidth}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground">PT-LP principal</p>
          <p className="font-mono font-semibold text-[#d4a853]">{formatCurrency(pt)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground">YT-LP fees</p>
          <p className="font-mono font-semibold text-[#2dd4bf]">{formatCurrency(yt)}</p>
        </div>
      </div>
    </div>
  );
}
