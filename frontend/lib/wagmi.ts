"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient } from "@tanstack/react-query";
import { http } from "wagmi";
import { baseSepolia, foundry, unichainSepolia } from "wagmi/chains";

export const queryClient = new QueryClient();

export const wagmiConfig = getDefaultConfig({
  appName: "StructuredYield Hook",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "structuredyield-local-dev",
  chains: [foundry, baseSepolia, unichainSepolia],
  transports: {
    [foundry.id]: http(),
    [baseSepolia.id]: http(),
    [unichainSepolia.id]: http("https://sepolia.unichain.org")
  }
});
