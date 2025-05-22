// 'use client'
import Linker from "@/components/base/Linker";
import "./page.scss";
import Image from "next/image";
import Button from "@/components/base/Button";
import { linkSwap } from "@/utils/url";

const Home = () => {
  return (
    <main className="home-page">
      <div className="home container w-full">
        <Image
          src="/img/home-rbg.svg"
          alt="bg"
          className="bg"
          width={209.265}
          height={214}
        />
        <Image
          src="/img/home-bbg.svg"
          alt="bg"
          className="bg"
          width={209.265}
          height={214}
        />
        <div>
          <h1>Sui's First Parallel AMM.</h1>
          <h2>
            OctopuSwap is a parallel AMM that structures a single liquidity pool
            using multiple parallel shared objects for parallelized transaction,
            enabling faster and cheaper transactions.
          </h2>
        </div>
        <Linker className="w-[218px]" href={linkSwap()}>
          <Button>Go Swap</Button>
        </Linker>
        <div className="ex-box">
          <div
            style={{
              width: "510px",
              height: "580px",
              overflow: "hidden",
              borderRadius: "40px",
              background: "rgb(22,22,22)",
            }}
          >
            <Image
              width={455}
              height={440}
              src="/img/octopu-swap.png"
              alt="octopu swap"
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
