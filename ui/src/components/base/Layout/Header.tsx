"use client";

import Linker from "@/components/base/Linker";
import { useEffect, useState } from "react";
import clss from "classnames";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useWalletAddress } from "@/hooks/WalletContext";
import { seesaw } from "@/utils/string";
import { linkHome, linkSwap } from "@/utils/url";
import { DEFAULT_HEADER_ICON } from "@/constants";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";

export default function Header() {
  const pathname = usePathname();
  const { address, rawAddress } = useWalletAddress();
  const [isReady, setIsReady] = useState(false);

  const wallet: any = useWallet();

  useEffect(() => {
    if (address) {
      setIsReady(true);
    }
  }, [address]);

  return (
    <header>
      <div className="container">
        <Linker className="logo" href={linkHome()}>
          <Image src="/img/new-logo.png" alt="logo" width={220} height={36} />
        </Linker>
        <nav>
          <Linker
            className={clss({ active: pathname === "/" })}
            href={linkHome()}
          >
            Home
          </Linker>
          <Linker
            className={clss({ active: pathname.match("/swap") })}
            href={linkSwap()}
          >
            Swap
          </Linker>
        </nav>
        {isReady ? (
          address ? (
            <Linker href={""} className="address-box">
              <img src={DEFAULT_HEADER_ICON} alt="addr" />
              <div className="info" style={{ textAlign: "center" }}>
                <p className="name line-clamp">{wallet?.name || "--"}</p>
                <p className="font-mono">
                  {seesaw({ raw: address, isAddress: true })}
                </p>
              </div>
            </Linker>
          ) : (
            <ConnectButton
              className="linear-bg"
              style={{
                fontFamily: "Poppins",
                fontSize: "14px",
                width: "160px",
              }}
            >
              Connect Wallet
            </ConnectButton>
          )
        ) : (
          <div style={{ width: "160px", height: "40px" }} />
        )}
      </div>
    </header>
  );
}
