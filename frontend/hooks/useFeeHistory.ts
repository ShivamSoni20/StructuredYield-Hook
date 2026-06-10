"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

export type FeeEvent = {
  timestamp: string;
  feeAmount: string;
  poolId: string;
};

type FeeHistoryResponse = {
  data?: {
    feeRoutes?: FeeEvent[];
  };
  errors?: Array<{ message: string }>;
};

const FEES_QUERY = `
  query FeeHistory {
    feeRoutes(orderBy: timestamp, orderDirection: asc) {
      timestamp
      feeAmount: ytFees
      poolId
    }
  }
`;

export function useFeeHistory() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["fee-history", address, SUBGRAPH_URL],
    enabled: Boolean(address && SUBGRAPH_URL),
    queryFn: async () => {
      const response = await fetch(SUBGRAPH_URL as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: FEES_QUERY })
      });

      if (!response.ok) {
        throw new Error("Could not load fee history.");
      }

      const json = (await response.json()) as FeeHistoryResponse;
      if (json.errors?.length) {
        throw new Error(json.errors[0].message);
      }

      return json.data?.feeRoutes ?? [];
    }
  });
}
