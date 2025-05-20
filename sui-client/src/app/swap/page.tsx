import Back from "@/components/combined/Back";
import "./index.scss";
import SwapForm from "@/components/combined/SwapForm";

const Swap = async () => {
  return (
    <main className="swap-page container">
      <Back />
      <SwapForm tokenList={[]} />
    </main>
  );
};

export default Swap;
