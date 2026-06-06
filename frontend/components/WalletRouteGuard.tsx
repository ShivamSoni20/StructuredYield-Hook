"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export function WalletRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const checkingWallet = isConnecting || isReconnecting;

  useEffect(() => {
    if (!checkingWallet && !isConnected) router.replace("/");
  }, [checkingWallet, isConnected, router]);

  if (checkingWallet) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking wallet connection...
      </main>
    );
  }

  if (!isConnected) return null;

  return <>{children}</>;
}
