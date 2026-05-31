"use client";

import { usePosition } from "@/hooks/usePositions";

export function useInsuranceVault() {
  const { data } = usePosition();

  return {
    isSolvent: data.isVaultSolvent,
    coveredIL: data.currentILAmount,
    currentILBps: data.currentILBps
  };
}

