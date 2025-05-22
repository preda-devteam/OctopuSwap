import { Suspense } from "react";
import Back from "@/components/combined/Back";
import "./index.scss";
import SwapForm from "@/components/combined/SwapForm";

const Swap = async () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="swap-page container">
        <Back />
        <SwapForm tokenList={[]} />
      </main>
    </Suspense>
  );
};

export default Swap;
