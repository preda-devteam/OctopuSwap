import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import BigNumber from "bignumber.js";
import { PREPARE, TOKEN_TYPE } from "@/constants";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const K = 1024;
const M = 1024 * K;
const G = 1024 * M;
const NK = 1000;
const NM = 1000 * NK;

type Unit = "GB" | "KB" | "MB" | "Bytes";
type SeesawProps = {
  raw: string;
  startPiece?: number;
  endPiece?: number;
  splitStr?: string;
  isHash?: boolean;
  isAddress?: boolean;
};
export function seesaw({
  raw,
  startPiece = 3,
  endPiece = 3,
  splitStr = ":",
  isHash,
  isAddress,
}: SeesawProps) {
  if (!raw) return "";
  if (raw.length <= startPiece + endPiece) {
    return raw;
  }
  const hash = raw.split(splitStr)[0];
  const content = hash.slice(0, startPiece) + ":" + hash.slice(endPiece * -1);
  if (isHash) return `<${content}>`;
  if (isAddress) return `[${content}]`;
  return content;
}

// /
export const bignumberDiv = (val1: number | string, val2: number | string) => {
  return new BigNumber(val1).dividedBy(val2).toFixed();
};
// x
const bignumberMult = (val1: number | string, val2: number | string) => {
  return new BigNumber(val1).multipliedBy(val2).toFixed();
};

const DecimalsEnum = {
  ETH: 18,
  DEFAULT: 0,
  SOL: 9,
  DIO: 8,
};

const token2Decimals = (token?: string) => {
  if (!token) return 0;
  const upperToken = token?.toUpperCase() as keyof typeof DecimalsEnum;
  return DecimalsEnum[upperToken] || DecimalsEnum.DEFAULT;
};

export const toTokenAmount = (
  amount: number | string,
  token: string,
  decimals?: number
) => {
  return bignumberDiv(amount || 0, 10 ** (decimals || token2Decimals(token)));
};
export const toAmountToken = (
  amount: number | string,
  token: string,
  decimals?: number
) => {
  return bignumberMult(amount || 0, 10 ** (decimals || token2Decimals(token)));
};

export const toFixed = (value: string | number, fixed?: number) => {
  return new BigNumber(value)
    .toFixed(fixed || 0, 1)
    .replace(/(\.[0-9]*[1-9])0*|(\.0*)/, "$1");
};

export const toFixedInputAmount = (value: string, fixed: number) => {
  const [, float] = value.split(".");
  if (float?.length > fixed) {
    return toFixed(value, fixed);
  } else {
    return value;
  }
};

export const isAmount = (amount: string) => {
  if (!amount) return true;
  const regex = /^[0-9]+\.?[0-9]*$/;
  return regex.test(amount);
};
