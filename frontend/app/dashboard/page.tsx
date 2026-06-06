"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { WalletRouteGuard } from "@/components/WalletRouteGuard";

export default function DashboardPage() {
  return (
    <WalletRouteGuard>
      <main
        className="structuredyield-frame-shell"
        style={{
          background: "#0a0b0d",
          height: "100dvh",
          margin: 0,
          overflow: "hidden",
          width: "100vw"
        }}
      >
        <ConnectWallet listenForWalletRequests visuallyHidden />
        <iframe
          src="/structuredyield.html?view=dashboard"
          title="StructuredYield dashboard"
          className="structuredyield-frame"
          style={{
            border: 0,
            display: "block",
            height: "100dvh",
            width: "100vw"
          }}
        />
      </main>
    </WalletRouteGuard>
  );
}
