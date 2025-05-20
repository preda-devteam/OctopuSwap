import Request, { CommonSignParams } from "./request";
import { XBTC_TYPE_NEW, XSUI_TYPE_NEW } from "@/constants";

const request = new Request({ baseURL: "/" });

export enum TokenStatus {
  DEFAULT = 0,
  VOTE = 13,
  VOTE_SETTLED = 23,
  LAUNCH = 33,
  SWAP = 40,
  FINISH = 50,
}

export type Thread = {
  TokenAddress: string;
  Address: string;
  Content: string;
  CreateTime: number;
  UserName: string;
  UserIconUrl: string;
};

export interface ThreadParams extends CommonSignParams {
  tokenaddress: string;
  content: string;
  address: string;
}

export interface Holder {
  Address: string;
  UserTotalAmount: string;
  TotalAmount: string;
  UserL1TotalAmount: string;
  UserName: string;
  UserIconUrl: string;
  Decimals: number;
}

export interface TokenPrice {
  tokenaddress: string;
  l1token: string;
  interval: number;
  start?: number;
  end?: number;
}

export interface Price {
  open: string;
  close: string;
  high: string;
  low: string;
  timestamp: number;
}

export interface LastPrice {
  price: string;
  timestamp: number;
}

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
  static getThread(tokenaddress: string) {
    return request.get<Thread[]>("/", {
      params: { module: "comment", action: "list", tokenaddress },
    });
  }
  static addThread(params: ThreadParams) {
    return request.post("/", {
      params: { module: "comment", action: "add", ...params },
    });
  }
  static getHolders(tokenaddress: string) {
    return request.get<Holder[]>("/", {
      params: { module: "activity", action: "holders", tokenaddress },
    });
  }
  static getPrice(priceParam: TokenPrice) {
    return request.get<Price[] | LastPrice>("/", {
      params: { module: "aitoken", action: "price", ...priceParam },
    });
  }
  static getSwapList() {
    return request.get<TokenSwapTrade[]>("/", {
      params: { module: "aitoken", action: "swaptokens" },
    });
  }
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
