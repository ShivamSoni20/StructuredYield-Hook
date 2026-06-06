"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

declare global {
  interface Window {
    structuredYieldConnectWallet?: () => void;
    structuredYieldOpenWalletMenu?: () => void;
  }
}

type Props = {
  redirectOnConnect?: boolean;
  listenForWalletRequests?: boolean;
  visuallyHidden?: boolean;
};

export function ConnectWallet({
  redirectOnConnect = false,
  listenForWalletRequests = false,
  visuallyHidden = false
}: Props) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const openConnectModalRef = useRef<(() => void) | undefined>();
  const openAccountModalRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    if (redirectOnConnect && isConnected) router.replace("/dashboard");
  }, [isConnected, redirectOnConnect, router]);

  useEffect(() => {
    window.frames[0]?.postMessage(
      {
        type: "structuredyield:wallet-state",
        address: isConnected ? address : null
      },
      window.location.origin
    );
  }, [address, isConnected]);

  useEffect(() => {
    if (!listenForWalletRequests) return;

    function sendWalletState() {
      window.frames[0]?.postMessage(
        {
          type: "structuredyield:wallet-state",
          address: isConnected ? address : null
        },
        window.location.origin
      );
    }

    function openWalletModal() {
      openConnectModalRef.current?.();
    }

    function openWalletMenu() {
      if (isConnected) {
        openAccountModalRef.current?.();
        return;
      }
      openConnectModalRef.current?.();
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "structuredyield:connect-wallet") openWalletModal();
      if (event.data?.type === "structuredyield:open-wallet-menu") openWalletMenu();
      if (event.data?.type === "structuredyield:request-wallet-state") sendWalletState();
    }

    window.structuredYieldConnectWallet = openWalletModal;
    window.structuredYieldOpenWalletMenu = openWalletMenu;
    window.addEventListener("message", onMessage);
    sendWalletState();

    return () => {
      if (window.structuredYieldConnectWallet === openWalletModal) {
        delete window.structuredYieldConnectWallet;
      }
      if (window.structuredYieldOpenWalletMenu === openWalletMenu) {
        delete window.structuredYieldOpenWalletMenu;
      }
      window.removeEventListener("message", onMessage);
    };
  }, [address, isConnected, listenForWalletRequests]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        openConnectModalRef.current = openConnectModal;
        openAccountModalRef.current = openAccountModal;
        const ready = mounted;
        const connected = ready && account && chain;

        if (visuallyHidden) {
          return <span aria-hidden="true" className="sr-only" />;
        }

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-violet-500/20 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              Connect wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Wrong network
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={openAccountModal}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
