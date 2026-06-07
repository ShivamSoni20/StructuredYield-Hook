"use client";

import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { baseSepolia, foundry, unichainSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,
      staleTime: 30_000
    }
  }
});

const chains = [unichainSepolia, foundry, baseSepolia] as const;
const transports = {
  [foundry.id]: http(),
  [baseSepolia.id]: http(),
  [unichainSepolia.id]: http("https://sepolia.unichain.org")
};

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected({ shimDisconnect: true })],
  transports,
  ssr: true
});
