"use client";

import { ConnectWallet } from "@/components/ConnectWallet";

export default function HomePage() {
  return (
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
      <ConnectWallet redirectOnConnect listenForWalletRequests visuallyHidden />
      <iframe
        src="/structuredyield.html"
        title="StructuredYield application"
        className="structuredyield-frame"
        style={{
          border: 0,
          display: "block",
          height: "100dvh",
          width: "100vw"
        }}
      />
    </main>
  );
}
