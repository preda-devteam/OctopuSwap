"use client";

import { WalletProvider } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import { WalletContextProvider } from "@/hooks/WalletContext";

export default function WalletWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </WalletProvider>
  );
}
