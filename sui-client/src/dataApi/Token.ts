import Request, { CommonSignParams } from "./request";
import { XBTC_TYPE_NEW, XSUI_TYPE_NEW } from "@/constants";

const request = new Request({ baseURL: "/" });

export interface TokenSwapTrade {
  Image: string;
  TokenAddress: string;
  Amount: string;
  L1Token: string;
  L1TokenDecimals: number;
  Decimals: number;
  OnChain: number;
  BlockTime: number;
  L1Price?: string;
}

export interface AmountOutParams {
  tokenaddress: string;
  phase: string;
  l1token: string;
  l1tokenin?: number | string;
  xtokenin?: number | string;
  l1tokenout?: number | string;
  xtokenout?: number | string;
}

export default class TokenAPI {
  static getAmountOut(amountOutParams: AmountOutParams) {
    const params = amountOutParams?.l1tokenin
      ? { xAmountIn: amountOutParams?.l1tokenin }
      : { yAmountIn: amountOutParams?.xtokenin };
    return request.get<string>("/getAmountOut", {
      params: {
        xName: XBTC_TYPE_NEW,
        yName: XSUI_TYPE_NEW,
        ...params,
      },
    });
  }
  static getAmountIn(amountOutParams: AmountOutParams) {
    const params = amountOutParams?.l1tokenout
      ? { xAmountOut: amountOutParams?.l1tokenout }
      : { yAmountOut: amountOutParams?.xtokenout };
    return request.get<string>("/getAmountIn", {
      params: {
        xName: XBTC_TYPE_NEW,
        yName: XSUI_TYPE_NEW,
        ...params,
      },
    });
  }
}
