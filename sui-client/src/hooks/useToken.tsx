import TokenAPI, { AmountOutParams } from "@/dataApi/Token";
import { useRequest } from "ahooks";
import { useState } from "react";

export interface PriceProps {
  tokenaddress?: string;
  l1token?: string;
}

export function useAsyncTokenExchangeOut(props: AmountOutParams) {
  const { tokenaddress, phase, l1token } = props;
  // const [cacheMap, setCacheMap] = useState<{ [x: string]: string }>({})
  const [reloadTime, setReloadTime] = useState(0);
  const [cacheParams, setcacheParams] = useState<AmountOutParams>();
  const {
    data = "0",
    runAsync: getData,
    loading,
  } = useRequest(
    async (args: { l1tokenin?: string; xtokenin?: string }) => {
      const { l1tokenin, xtokenin } = args || {};
      if (!tokenaddress || !l1token || (!l1token && !l1tokenin && !xtokenin))
        return "0";

      const params = {
        tokenaddress,
        phase,
        l1token,
        l1tokenin: l1tokenin,
        xtokenin: xtokenin,
        amount: 1,
      };
      setcacheParams(params);
      const exchangesRes = await TokenAPI.getAmountOut(params);
      return exchangesRes.data;
    },
    {
      manual: true,
      debounceWait: 300,
      refreshDeps: [tokenaddress, l1token, reloadTime],
    }
  );
  return {
    data,
    reload: () => {
      setReloadTime((reloadTime) => reloadTime + 1);
      getData({
        l1tokenin: cacheParams?.l1tokenin?.toString(),
        xtokenin: cacheParams?.xtokenin?.toString(),
      });
    },
    loading,
    getData,
  };
}

export function useAsyncTokenExchangeIn(props: AmountOutParams) {
  const { tokenaddress, phase, l1token } = props;
  const [reloadTime, setReloadTime] = useState(0);
  const [cacheParams, setcacheParams] = useState<AmountOutParams>();
  const {
    data = "0",
    runAsync: getData,
    loading,
  } = useRequest(
    async ({
      l1tokenout,
      xtokenout,
    }: {
      l1tokenout?: string;
      xtokenout?: string;
    }) => {
      if (!tokenaddress || !l1token || (!l1token && !l1tokenout)) return "0";
      const params = {
        tokenaddress,
        phase,
        l1token,
        l1tokenout: l1tokenout,
        xtokenout: xtokenout,
      };
      setcacheParams(params);
      const exchangesRes = await TokenAPI.getAmountIn(params);
      console.log("============useAsyncTokenExchangeIn", exchangesRes.data);
      return exchangesRes.data;
    },
    {
      manual: true,
      debounceWait: 300,
      refreshDeps: [tokenaddress, l1token, reloadTime],
    }
  );
  return {
    data,
    getData,
    reload: () => {
      setReloadTime((reloadTime) => reloadTime + 1);
      getData({
        l1tokenout: cacheParams?.l1tokenout?.toString(),
        xtokenout: cacheParams?.xtokenout?.toString(),
      });
    },
    loading,
  };
}
