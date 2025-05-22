"use client";
import Button from "@/components/base/Button";
import Select, { OptProps, Selected } from "@/components/base/Select";
import {
  PACKAGE_ID_Devnet,
  PACKAGE_ID_Testnet,
  TOKEN_TYPE,
  XBTC_TYPE_Devnet,
  XBTC_TYPE_Testnet,
  XSUI_TYPE_Devnet,
  XSUI_TYPE_Testnet,
} from "@/constants";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clss from "classnames";
import "./index.scss";
import toasty from "@/components/base/Toast";
import { TokenSwapTrade } from "@/dataApi/Token";
import {
  useAsyncTokenExchangeIn,
  useAsyncTokenExchangeOut,
} from "@/hooks/useToken";
import {
  bignumberDiv,
  isAmount,
  toAmountToken,
  toFixed,
  toFixedInputAmount,
  toTokenAmount,
} from "@/utils/string";
import BigNumber from "bignumber.js";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { useWalletAddress } from "@/hooks/WalletContext";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

interface SwapFormProps {
  tokenList: TokenSwapTrade[];
}

const renderOption = (o: OptProps) => {
  return (
    <>
      <div className="pr-[8px] inline-block">
        <img
          className="w-[20px] h-[20px] object-cover rounded-full inline-block"
          src={o.icon}
          alt="opt-icon"
        />
      </div>{" "}
      {o.label}
    </>
  );
};

const SwapForm = (props: SwapFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultToken = searchParams.get("token");
  const defaultL1Token = searchParams.get("l1token");
  const [submitLoading, setSubmitLoading] = useState(false);
  const { tokenList } = props;

  const { address: suiAddress, rawAddress } = useWalletAddress();
  const [xSuiBalance, setXSuiBalance] = useState<string | null>(null);
  const [xBTCBalance, setXBTBalance] = useState<string | null>(null);
  const [globalPoolId, setGlobalPoolId] = useState<string | null>(null);
  const [subPoolId, setSubPoolId] = useState<string | null>(null);
  const [isBlockTrading, setIsBlockTrading] = useState(false);
  const [netGasFees, setNetGasFees] = useState<string | null>(null);

  const wallet: any = useWallet();
  const chain = wallet?.chain;
  
  const isDevnet = chain?.id.includes("devnet");
  const isTestnet = chain?.id.includes("testnet");

  const url = isDevnet
    ? "https://fullnode.devnet.sui.io:443"
    : isTestnet
    ? "https://fullnode.testnet.sui.io:443"
    : "";
  const package_id = isDevnet
    ? PACKAGE_ID_Devnet
    : isTestnet
    ? PACKAGE_ID_Testnet
    : "";

  const xsui_type = isDevnet ? XSUI_TYPE_Devnet : XSUI_TYPE_Testnet;
  const xbtc_type = isDevnet ? XBTC_TYPE_Devnet : XBTC_TYPE_Testnet;

  const client = new SuiClient({ url: url });

  async function getAllBalances(address: string) {
    console.log("getAllBalances", address);
    if (!address) return;

    const balances = await client.getAllBalances({ owner: address });
    console.log("balances", balances);
    console.log("xsui", xsui_type);
    console.log("xbtc", xbtc_type);

    balances.map((balance) => {
      const coinType = balance.coinType;
      if (coinType === xsui_type) {
        setXSuiBalance(toTokenAmount(balance.totalBalance, "", 9));
      } else if (coinType === xbtc_type) {
        setXBTBalance(toTokenAmount(balance.totalBalance, "", 9));
      }
    });
  }
  async function getXObjectId(address: string, coinType: string) {
    try {
      const coins = await client.getCoins({ owner: address, coinType });
      if (coins.data.length > 0) {
        const coinXObjectId = coins.data[0].coinObjectId;
        return coinXObjectId;
      } else {
        toasty({ content: "No coins found" });
      }
    } catch (error) {
      toasty({ content: "get Coin Object ID failed" });
    }
  }

  useEffect(() => {
    if (suiAddress) {
      setIsReady(true);
      getAllBalances(rawAddress as string);
    }
  }, [suiAddress, rawAddress]);

  // 0 - swap l1 to l2
  // 1 - swap l2 to l1
  const [swapType, setSwapType] = useState<number>();
  const [l1InputAmount, setl1InputAmount] = useState("");
  const [l2InputAmount, setl2InputAmount] = useState("");
  const [l1InputErr, setl1InputErr] = useState("");
  const [l2InputErr, setl2InputErr] = useState("");
  const [exchangeTokenPrice, setExchangeTokenPrice] = useState("");
  const [isReady, setIsReady] = useState(false);

  const tokenOptions = tokenList
    .filter((t, i, s) => {
      const singleToken =
        i === s.findIndex((i) => i.TokenAddress === t.TokenAddress);
      return t.OnChain === 13 && singleToken;
    })
    .map((token) => ({
      icon: token.Image,
      label: token.TokenAddress.split(":")[0],
      value: token.TokenAddress,
    }));
  const isDefaultInlist = defaultToken
    ? tokenOptions.some((i) => i.value === defaultToken)
    : false;
  const [selectToken, setSelectToken] = useState<Selected>(
    (isDefaultInlist && defaultToken) || tokenOptions?.[0]?.value || "XSUI"
  );

  const l1TokenTradeOptions = useMemo(() => {
    return tokenList
      .filter((i) => i.TokenAddress === selectToken)
      .map((token) => ({
        icon: `/img/${token.L1Token.toLowerCase()}-token.svg`,
        label: token.L1Token.split(":")[0],
        value: token.L1Token,
      }));
  }, [tokenList, selectToken]);
  const [selectL1Token, setSelectL1Token] = useState<Selected>(
    defaultL1Token || l1TokenTradeOptions?.[0]?.value || "XBTC"
  );
  const selectL1TokenName = selectL1Token.toString();

  const currentTokenData = useMemo(() => {
    const token = tokenList.find(
      (token) =>
        token.TokenAddress === selectToken &&
        selectL1TokenName === token.L1Token
    );
    return token;
  }, [selectToken, selectL1TokenName]);
  const { getData: loadOutExchange, reload: reloadOutExchange } =
    useAsyncTokenExchangeOut({
      tokenaddress: selectToken.toString(),
      l1token: selectL1TokenName,
      phase: TOKEN_TYPE.SWAP,
      l1tokenin: toAmountToken(1, selectL1TokenName),
      isDevnet,
      isTestnet,
    });
  const { getData: loadInExchange } =
    useAsyncTokenExchangeIn({
      tokenaddress: selectToken.toString(),
      l1token: selectL1TokenName,
      phase: TOKEN_TYPE.SWAP,
      l1tokenin: toAmountToken(1, selectL1TokenName),
      isDevnet,
      isTestnet,
    });

  const l1InputRef = useRef<HTMLInputElement>(null);
  const l2InputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateAmountOut({ l1tokenin: toAmountToken(1, selectL1TokenName) });
  }, []);

  const getGasFee = async (fee: string, swapType: number, type: string) => {
    const tx = new Transaction();

    const amountIn = toAmountToken(fee, "", 9);
    const coinXObjectId = await getXObjectId(rawAddress as string, type);
    const [coin] = tx.splitCoins(coinXObjectId as string, [amountIn]);


    const swap_func = !swapType
      ? isBlockTrading
        ? "swap_x_for_y_g"
        : "swap_x_for_y"
      : isBlockTrading
      ? "swap_y_for_x_g"
      : "swap_y_for_x";

    tx.moveCall({
      target: `${package_id}::amm_parallelization::${swap_func}`,
      arguments: [
        tx.object(globalPoolId || ""),
        tx.object(subPoolId || ""),
        tx.object(coin),
        tx.pure.u64(0),
      ],
      typeArguments: [xbtc_type, xsui_type],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: rawAddress as string,
    });

    const gasUsed = result.effects?.gasUsed;
    const netGasFees =
      Number(gasUsed.computationCost) +
      Number(gasUsed.storageCost) +
      -Number(gasUsed.storageRebate);

    setNetGasFees(toTokenAmount(netGasFees, "", 9));

    return (
      Number(gasUsed.computationCost) +
      Number(gasUsed.storageCost) +
      -Number(gasUsed.storageRebate)
    );
  };

  useEffect(() => {
    if (!swapType && l1InputAmount && +l1InputAmount) {
      getGasFee(l1InputAmount, swapType as number, xbtc_type);
    } else if (swapType && l1InputAmount && +l1InputAmount) {
      getGasFee(l2InputAmount, swapType, xsui_type);
    }
  }, [swapType, l1InputAmount, l2InputAmount, netGasFees]);

  useEffect(() => {
    if (selectToken) {
      if (defaultToken !== selectToken) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("token", selectToken.toString());
        router.replace(pathname + "?" + params);
      }
    }

    if (selectL1TokenName) {
      if (defaultL1Token !== selectL1TokenName) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("l1token", selectL1TokenName);
        router.replace(pathname + "?" + params);
      }
    }
  }, [selectToken, defaultToken, selectL1TokenName, defaultL1Token]);

  const reloadAll = () => {
    getAllBalances(rawAddress as string);
  };

  const toggleSwapType = () => {
    setSwapType((swapType) => (!swapType ? 1 : 0));
    getAllBalances(rawAddress as string);
    if (swapType) {
      // l1 to l2
      updateAmountOut({
        l1tokenin: toAmountToken(l1InputAmount || 1, selectL1TokenName),
        l1InputAmount,
      });
    } else {
      // l2 to l1
      updateAmountOut({
        xtokenin: toAmountToken(
          l2InputAmount || 1,
          "",
          currentTokenData?.Decimals
        ),
        l2InputAmount,
      });
    }
  };

  const handleChangeToken = (v: Selected) => {
    setSelectToken(v);
    const isL1TokenInSwap = tokenList.find(
      (token) => token.TokenAddress === v && token.L1Token === selectL1Token
    );
    if (!isL1TokenInSwap) {
      const defaultL1Token = tokenList.find(
        (token) => token.TokenAddress === v
      )?.L1Token;
      defaultL1Token && setSelectL1Token(defaultL1Token);
    }
    if (!swapType) {
      updateAmountOut({
        l1tokenin: toAmountToken(l1InputAmount || 1, selectL1TokenName),
        l1InputAmount,
      });
    } else {
      updateAmountOut({
        xtokenin: toAmountToken(
          l2InputAmount || 1,
          "",
          currentTokenData?.Decimals
        ),
        l2InputAmount,
      });
    }
  };

  const handleChangeL1Token = (selectL1: Selected) => {
    setSelectL1Token(selectL1);
    const newSelectL1Token = selectL1.toString();

    if (!swapType) {
      updateAmountOut({
        l1tokenin: toAmountToken(l1InputAmount || 1, newSelectL1Token),
        l1InputAmount,
        newSelectL1Token,
      });
    } else {
      updateAmountOut({
        xtokenin: toAmountToken(
          l2InputAmount || 1,
          "",
          currentTokenData?.Decimals
        ),
        l2InputAmount,
        newSelectL1Token,
      });
    }
  };

  const checkInputError = () => {
    resetInputError();
    const l1InputAmount = l1InputRef.current?.value;
    const l2InputAmount = l2InputRef.current?.value;
    if (!l1InputAmount || !+l1InputAmount) {
      setl1InputErr("Swap amount required");
      return false;
    }
    if (!l2InputAmount || !+l2InputAmount) {
      setl2InputErr("Swap amount required");
      return false;
    }
    if (!swapType) {
      if (new BigNumber(l1InputAmount).gt((xBTCBalance || 0) as number)) {
        setl1InputErr("Insufficient balance");
        return false;
      }
    } else {
      if (new BigNumber(l2InputAmount).gt(xSuiBalance || 0)) {
        setl2InputErr("Insufficient balance");
        return false;
      }
    }
    return true;
  };

  const handleChangeL1InputAmount: ChangeEventHandler<
    HTMLInputElement
  > = async (e) => {
    const value = e.target.value;
    if (!isAmount(value)) return;
    const fixedVal = toFixedInputAmount(value, 8);
    setl1InputAmount(fixedVal);

    // setSwapType(+!!swapType)
    const amountToken = toAmountToken(fixedVal, selectL1TokenName);
    if (swapType) {
      updateAmountIn({ l1tokenout: amountToken, l1InputAmount: fixedVal });
    } else {
      updateAmountOut({ l1tokenin: amountToken, l1InputAmount: fixedVal });
    }
    // setl2InputAmount(toFixed(bignumberMult(fixedVal || 0, exchangeNumber).toString(), 8))
  };

  const handleChangeL2InputAmount: ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const value = e.target.value;
    if (!isAmount(value)) return;
    const fixedVal = toFixedInputAmount(value, 8);
    setl2InputAmount(fixedVal);
    const amountToken = toAmountToken(fixedVal, "", currentTokenData?.Decimals);
    if (swapType) {
      updateAmountOut({ xtokenin: amountToken, l2InputAmount: fixedVal });
    } else {
      updateAmountIn({ xtokenout: amountToken, l2InputAmount: fixedVal });
    }
    // setl1InputAmount(toFixed(bignumberDiv(fixedVal || 0, exchangeNumber).toString(), 8))
  };
  // want to receive
  const updateAmountIn = async ({
    l1tokenout,
    xtokenout,
    l1InputAmount,
    l2InputAmount,
  }: {
    l1tokenout?: string;
    xtokenout?: string;
    l1InputAmount?: string;
    l2InputAmount?: string;
  }) => {
    console.log("updateAmountIn", l1tokenout, xtokenout);
    const new_l1tokenout = l1tokenout
      ? toAmountToken(l1tokenout, "", 9)
      : undefined;
    const new_xtokenout = xtokenout
      ? toAmountToken(xtokenout, "", 9)
      : undefined;

    const result: any = await loadInExchange({
      l1tokenout: new_l1tokenout,
      xtokenout: new_xtokenout,
    });

    if (result) {
      setGlobalPoolId(result[0]?.globalPoolId);
      setSubPoolId(result[0]?.subPoolId);
      setIsBlockTrading(result[0]?.isBlockTrading);
      if (l1tokenout) {
        const exChangePrice = toTokenAmount(
          bignumberDiv(result[0]?.amountIn, l1InputAmount || 1),
          "",
          9
        );
        setExchangeTokenPrice(
          toFixedInputAmount(bignumberDiv(1, exChangePrice || 1), 8)
        );

        if (l1InputAmount) {
          setl2InputAmount(toTokenAmount(result[0]?.amountIn, "", 9));
          setTimeout(checkInputError);
        }
      } else if (xtokenout) {
        const exChangePrice = toTokenAmount(
          bignumberDiv(result[0]?.amountIn, l2InputAmount || 1),
          "",
          9
        );
        setExchangeTokenPrice(
          parseInt(bignumberDiv(1, exChangePrice).toString()).toString()
        );

        if (l2InputAmount) {
          setl1InputAmount(
            toFixedInputAmount(toTokenAmount(result[0]?.amountIn, "", 9), 8)
          );
          setTimeout(checkInputError);
        }
      }
    }
  };
  // want to send
  const updateAmountOut = async ({
    l1tokenin,
    xtokenin,
    l1InputAmount,
    l2InputAmount,
  }: {
    l1tokenin?: string;
    xtokenin?: string;
    l1InputAmount?: string;
    l2InputAmount?: string;
    newSelectL1Token?: string;
  }) => {
    console.log("updateAmountOut", l1tokenin, xtokenin);
    const new_l1tokenin = l1tokenin
      ? toAmountToken(l1tokenin, "", 9)
      : undefined;
    const new_xtokenin = xtokenin ? toAmountToken(xtokenin, "", 9) : undefined;
    const result: any = await loadOutExchange({
      l1tokenin: new_l1tokenin,
      xtokenin: new_xtokenin,
    });
    if (result) {
      setGlobalPoolId(result[0]?.globalPoolId);
      setSubPoolId(result[0]?.subPoolId);
      setIsBlockTrading(result[0]?.isBlockTrading);
      const l2Decimals = 9;
      if (l1tokenin) {
        const initAmount = parseFloat(
          toTokenAmount(
            bignumberDiv(result[0]?.amountOut, l1InputAmount || 1),
            "",
            l2Decimals
          )
        );
        const exChangePrice =
          initAmount >= 1
            ? parseInt(
                toTokenAmount(
                  bignumberDiv(result[0]?.amountOut, l1InputAmount || 1),
                  "",
                  l2Decimals
                )
              )
            : toFixed(
                toTokenAmount(
                  bignumberDiv(result[0]?.amountOut, l1InputAmount || 1),
                  "",
                  l2Decimals
                ),
                8
              );
        setExchangeTokenPrice(exChangePrice.toString());
        if (l1InputAmount) {
          setl2InputAmount(toTokenAmount(result[0]?.amountOut, "", l2Decimals));
          setTimeout(checkInputError);
        }
      } else if (xtokenin) {
        const exChangePrice = toTokenAmount(
          bignumberDiv(result[0]?.amountOut, l2InputAmount || 1),
          "",
          l2Decimals
        );
        setExchangeTokenPrice(toFixedInputAmount(exChangePrice, 8));
        if (l2InputAmount) {
          setl1InputAmount(
            toFixedInputAmount(
              toTokenAmount(result[0]?.amountOut, "", l2Decimals),
              8
            )
          );
          setTimeout(checkInputError);
        }
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!checkInputError()) return;
      setSubmitLoading(true);
      if (swapType) {
        await swapL2ToL1();
      } else {
        await swapL1ToL2();
      }
    } catch (err: any) {
      toasty({ content: err?.reason || err?.err?.message || err?.message });
    }

    setSubmitLoading(false);
  };

  const resetInputError = () => {
    setl1InputErr("");
    setl2InputErr("");
  };
  const resetInput = () => {
    setl1InputAmount("");
    setl2InputAmount("");
    loadOutExchange({ l1tokenin: toAmountToken(1, selectL1TokenName) });
  };

  const swapL1ToL2 = async () => {
    if (!rawAddress) return;

    const tx = new Transaction();
    let coinXObjectId = "";
    const coins = await client.getCoins({
      owner: rawAddress,
      coinType: xbtc_type,
    });

    if (coins.data.length === 0) {
      toasty({ content: "No XBTC coins found" });
      return;
    }

    if (coins.data.length === 1) {
      coinXObjectId = coins.data[0].coinObjectId;
    } else {
      try {
        const primaryCoin = tx.object(coins.data[0].coinObjectId);
        const sourceCoins = coins.data
          .slice(1)
          .map((coin) => tx.object(coin.coinObjectId));
        tx.mergeCoins(primaryCoin, sourceCoins);
        coinXObjectId = coins.data[0].coinObjectId;
      } catch (error) {
        toasty({ content: "Error merging coins" });
        return;
      }
    }

    const amountIn = toAmountToken(l1InputAmount, "", 9);
    const [coin] = tx.splitCoins(coinXObjectId as string, [amountIn]);

    tx.moveCall({
      target: `${package_id}::amm_parallelization::${
        isBlockTrading ? "swap_x_for_y_g" : "swap_x_for_y"
      }`,
      arguments: [
        tx.object(globalPoolId || ""),
        tx.object(subPoolId || ""),
        tx.object(coin),
        tx.pure.u64(0),
      ],
      typeArguments: [xbtc_type, xsui_type],
    });

    await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    toasty({ content: "Swap Success" });
    resetInput();
    getAllBalances(rawAddress as string);
  };

  const swapL2ToL1 = async () => {
    if (!rawAddress) return;

    const tx = new Transaction();

    let coinXObjectId = "";
    const coins = await client.getCoins({
      owner: rawAddress,
      coinType: xsui_type,
    });

    if (coins.data.length === 0) {
      toasty({ content: "No XSUI coins found" });
      return;
    }

    if (coins.data.length === 1) {
      coinXObjectId = coins.data[0].coinObjectId;
    } else {
      try {
        const primaryCoin = tx.object(coins.data[0].coinObjectId);
        const sourceCoins = coins.data
          .slice(1)
          .map((coin) => tx.object(coin.coinObjectId));
        tx.mergeCoins(primaryCoin, sourceCoins);
        coinXObjectId = coins.data[0].coinObjectId;
      } catch (error) {
        toasty({ content: "Error merging coins" });
        return;
      }
    }

    const amountIn = toAmountToken(l2InputAmount, "", 9);
    const [coin] = tx.splitCoins(coinXObjectId as string, [amountIn]);

    tx.moveCall({
      target: `${package_id}::amm_parallelization::${
        isBlockTrading ? "swap_y_for_x_g" : "swap_y_for_x"
      }`,
      arguments: [
        tx.object(globalPoolId || ""),
        tx.object(subPoolId || ""),
        tx.object(coin),
        tx.pure.u64(0),
      ],
      typeArguments: [xbtc_type, xsui_type],
    });

    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    toasty({ content: "Swap Success" });
    resetInput();
    getAllBalances(rawAddress as string);
  };

  const [payBalance, receiveBalance] = useMemo(() => {
    if (swapType) {
      return [xSuiBalance, xBTCBalance];
    } else {
      return [xBTCBalance, xSuiBalance];
    }
  }, [swapType, xSuiBalance, xBTCBalance]);

  const renderExchangePrice = useMemo(() => {
    const l1Token = selectL1TokenName;
    const l2Token = selectToken.toString();

    return (
      <>
        1 {swapType ? l2Token : l1Token} ≈{" "}
        {isNaN(Number(exchangeTokenPrice)) ? 0 : exchangeTokenPrice}{" "}
        {swapType ? l1Token : l2Token}{" "}
      </>
    );
  }, [selectL1Token, exchangeTokenPrice, currentTokenData, swapType]);

  const isUnConnectL1Wallet = useMemo(() => {
    if (suiAddress) {
      return false;
    } else {
      return true;
    }
  }, [suiAddress]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className={clss(
          swapType === undefined ? "" : swapType ? "l2t1" : "l1t2",
          "swap-form"
        )}
      >
        <h2 className="flex items-center justify-between">Swap</h2>
        <div className="swap-input">
          <div className="balance">
            <span>Pay</span>
            <span>Balance: {payBalance}</span>
          </div>
          <div className={clss({ error: l1InputErr }, "input l1")}>
            <Select
              selected={selectL1Token}
              options={[
                {
                  icon: "/img/btc-logo.svg",
                  label: "XBTC",
                  value: "XBTC",
                },
              ]}
              onChange={handleChangeL1Token}
              renderOption={renderOption}
            />
            <input
              ref={l1InputRef}
              value={l1InputAmount}
              onChange={handleChangeL1InputAmount}
              type="text"
            />
            <p className="err-text">{l1InputErr}</p>
          </div>
        </div>
        <Image
          className="swap-btn"
          src="/img/swap.svg"
          width={32}
          height={32}
          alt="swap"
          onClick={toggleSwapType}
        />
        <div className="swap-input">
          <div className="balance">
            <span>Receive (Estimated)</span>
            <span>Balance: {receiveBalance}</span>
          </div>
          <div className={clss({ error: l2InputErr }, "input l2")}>
            <Select
              options={[
                {
                  icon: "/img/sui-logo.svg",
                  label: "XSUI",
                  value: "XSUI",
                },
              ]}
              selected={selectToken}
              onChange={handleChangeToken}
              renderOption={renderOption}
            />
            <input
              ref={l2InputRef}
              value={l2InputAmount}
              onChange={handleChangeL2InputAmount}
              type="text"
            />
            <p className="err-text">{l2InputErr}</p>
          </div>
        </div>
        <div className="swap-exchange">
          {renderExchangePrice}
          <Image
            className="cursor-pointer"
            src="/img/exchange.svg"
            alt="exchange"
            width={18}
            height={17}
            onClick={reloadAll}
          />
        </div>
        {isReady ? (
          <Button
            disabled={
              !isUnConnectL1Wallet &&
              (!!l1InputErr || !!l2InputErr || !l1InputAmount || !l2InputAmount)
            }
            loading={submitLoading}
            className="swap-submit"
            onClick={handleSubmit}
          >
            {isUnConnectL1Wallet ? (
              <ConnectButton
                style={{
                  background: "transparent",
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  height: "40px",
                  padding: "0 20px",
                }}
              >
                Connect Wallet
              </ConnectButton>
            ) : (
              "Submit"
            )}
          </Button>
        ) : (
          <></>
        )}
        <div className="swap-tx-info">
          <span>Estimated Fee:</span>
          <span>{netGasFees || "--"} SUI</span>
        </div>
      </div>
    </div>
  );
};

export default SwapForm;
