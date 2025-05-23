import Request, { CommonSignParams } from "./request";
import {
  XBTC_TYPE_NEW_Devnet,
  XBTC_TYPE_NEW_Testnet,
  XSUI_TYPE_NEW_Devnet,
  XSUI_TYPE_NEW_Testnet,
} from "@/constants";

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
  isDevnet?: boolean;
  isTestnet?: boolean;
}

export default class TokenAPI {
  static getAmountOut(amountOutParams: AmountOutParams) {
    console.log(amountOutParams, "amountOutParams");
    const params = amountOutParams?.l1tokenin
      ? { xAmountIn: amountOutParams?.l1tokenin }
      : { yAmountIn: amountOutParams?.xtokenin };
    return request.get<string>("/getAmountOut", {
      params: {
        xName: amountOutParams?.isDevnet
          ? XBTC_TYPE_NEW_Devnet
          : XBTC_TYPE_NEW_Testnet,
        yName: amountOutParams?.isDevnet
          ? XSUI_TYPE_NEW_Devnet
          : XSUI_TYPE_NEW_Testnet,
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
        xName: amountOutParams?.isDevnet
          ? XBTC_TYPE_NEW_Devnet
          : XBTC_TYPE_NEW_Testnet,
        yName: amountOutParams?.isDevnet
          ? XSUI_TYPE_NEW_Devnet
          : XSUI_TYPE_NEW_Testnet,
        ...params,
      },
    });
  }
}
