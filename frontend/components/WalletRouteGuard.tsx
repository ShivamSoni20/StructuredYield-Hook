"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function WalletRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, status } = useAccount();
  const checkingWallet = status === "connecting" || status === "reconnecting";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checkingWallet) return;
    setChecked(true);
    if (!isConnected) router.replace("/");
  }, [checkingWallet, isConnected, router]);

  if (!checked || checkingWallet) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0b0d]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a853] border-t-transparent" />
          <p className="text-sm text-zinc-500">Checking wallet...</p>
        </div>
      </main>
    );
  }

  if (!isConnected) return null;

  return <>{children}</>;
}
