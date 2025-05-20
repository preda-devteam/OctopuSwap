"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useWallet, addressEllipsis } from "@suiet/wallet-kit";

interface WalletContextValue {
  address: string | null;
  rawAddress: string | null;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  rawAddress: null,
});

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const wallet = useWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [rawAddress, setRawAddress] = useState<string | null>(null);

  useEffect(() => {
    const raw = wallet?.account?.address || null;
    setRawAddress(raw);
    setAddress(raw ? addressEllipsis(raw) : null);
  }, [wallet?.account?.address]);

  return (
    <WalletContext.Provider value={{ address, rawAddress }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletAddress = () => useContext(WalletContext);
