import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import BigNumber from 'bignumber.js'
import { PREPARE, TOKEN_TYPE } from '@/constants'

dayjs.extend(relativeTime)
dayjs.extend(utc)

const K = 1024
const M = 1024 * K
const G = 1024 * M
const NK = 1000
const NM = 1000 * NK

type Unit = 'GB' | 'KB' | 'MB' | 'Bytes'
type SeesawProps = {
  raw: string
  startPiece?: number
  endPiece?: number
  splitStr?: string
  isHash?: boolean
  isAddress?: boolean
}
export function seesaw({ raw, startPiece = 3, endPiece = 3, splitStr = ':', isHash, isAddress }: SeesawProps) {
  if (!raw) return ''
  if (raw.length <= startPiece + endPiece) {
    return raw
  }
  const hash = raw.split(splitStr)[0]
  const content = hash.slice(0, startPiece) + ':' + hash.slice(endPiece * -1)
  if (isHash) return `<${content}>`
  if (isAddress) return `[${content}]`
  return content
}

export function toToken(props: {
  value?: string | number
  decimals?: number
  symbol?: string
  isPretty?: boolean
}): string {
  const { value, symbol, isPretty } = props
  const decimals = props?.decimals
  if (!value && value !== 0) return '--'
  let tokenValue = value
  if (typeof tokenValue === 'string') {
    tokenValue = tokenValue.split(':')[0]
  }
  if (typeof decimals === 'number') {
    tokenValue = new BigNumber(value).dividedBy(10 ** decimals).toFixed(decimals, 1)
  } else {
    tokenValue = new BigNumber(value).dividedBy(10 ** 0).toFixed()
  }

  tokenValue = tokenValue.replace(/(\.[0-9]*[1-9])0*|(\.0*)/, '$1')
  if (isPretty) {
    const [int, float] = tokenValue.split('.')
    tokenValue = prettyNumber(int) + (float ? '.' + float : '')
  }
  return tokenValue + (symbol ? ` ${symbol}` : '')
}

export function isUnset(value: any) {
  return value === '' || typeof value === 'undefined'
}

export function toShard(value: string | number, withUnit = true) {
  const unit = withUnit ? '@' : ''
  return unit + (String(value) === '65535' ? 'g' : String(value))
}

export const prettySize = (bytes: number | string, bit = 2): { value: number; unit: Unit } => {
  if (typeof bytes === 'string') {
    bytes = parseFloat(bytes)
  }

  let measure = 1
  let unit: Unit = 'Bytes'

  if (bytes > G) {
    measure = G
    unit = 'GB'
  } else if (bytes > M) {
    measure = M
    unit = 'MB'
  } else if (bytes > K) {
    measure = K
    unit = 'KB'
  }
  return {
    value: parseFloat((bytes / measure).toFixed(bit)),
    unit,
  }
}

export const prettyTxn = (value: number, bit = 2) => {
  if (typeof value === 'string') {
    value = parseFloat(value)
  }
  if (value > NM) {
    return parseFloat((value / NM).toFixed(bit))
  } else if (value > NK) {
    return parseFloat((value / NK).toFixed(bit))
  }
  return value?.toLocaleString()
}

// Converts a number to a string by using the current or specified locale.
// perttyNumber(12345) will output 12,345
export const prettyNumber = (value: number | string) => {
  if (typeof value === 'string') {
    value = parseFloat(value)
  }
  return value?.toLocaleString()
}

export const toMempool = (value: string) => {
  return value + 'Txn(s)'
}

export const toThroughput = (value: string) => {
  return value + 'TPS'
}

export const toShardCount = (shardOrder: string | number) => {
  return Math.pow(2, Number(shardOrder))
}

export const isGeniusHash = (value: string) => /^0+0$/.test(value)

export const toTxnUnit = (num: string | number) => {
  const bigNum = new BigNumber(num)
  const B = 10 ** 9
  const M = 10 ** 6
  const K = 10 ** 3
  if (bigNum.isGreaterThanOrEqualTo(B)) {
    return new BigNumber(num).dividedBy(B).toFixed(2) + ' B'
  }
  if (bigNum.isGreaterThanOrEqualTo(M)) {
    return bigNum.dividedBy(M).toFixed(2) + ' M'
  }
  if (bigNum.isGreaterThanOrEqualTo(K)) {
    return bigNum.dividedBy(K).toFixed(2) + ' K'
  }
  return num
}

export const toID = (id?: number | string) => {
  if (id === undefined) return ''
  return `#${id}`
}

export const toCoinAge = (age: number): string => {
  const sec = age / 10 ** 8 / (1024 * 1024)
  if (sec > 86400) {
    const day = sec / 86400
    if (day > 12) {
      const year = day / 12
      return `${year} Coin Year`
    }
    return `${day} Coin Day`
  }
  return `${sec} Coin Second`
}

export const toUTCTime = (time: number | string | undefined) => {
  if (!time) return ''
  return dayjs(time).utc().format('YYYY/MM/DD HH:mm') + ' (UTC)'
}

export const toUTCDay = (time: number | string | undefined) => {
  if (!time) return ''
  return dayjs(time).utc().format('YYYY-MM-DD')
}

export const isSingleByte = (str: string, num: number) => {
  return str.charCodeAt(num) < 127 && ![32, 94].includes(str.charCodeAt(num))
}

export const toNFTID = (serie: string | number, id: string | number, count?: number) => {
  const bigNumberID = new BigNumber(id)
  if (count && count > 1) {
    return `#${serie} [${bigNumberID.toString(16)}] - #${count - 1 + Number(serie)} [${bigNumberID
      .plus(count - 1)
      .toString(16)}]`
  }
  return `#${serie} [${bigNumberID.toString(16)}]`
}

export const toContractID = (decimalNumber?: string | number) => {
  if (!decimalNumber) return ''
  return `#0x${Number(decimalNumber).toString(16)}`
}

// /
export const bignumberDiv = (val1: number | string, val2: number | string) => {
  return new BigNumber(val1).dividedBy(val2).toFixed()
}
// x
export const bignumberMult = (val1: number | string, val2: number | string) => {
  return new BigNumber(val1).multipliedBy(val2).toFixed()
}
// -
export const bignumberMinus = (val1: number | string, val2: number | string) => {
  return new BigNumber(val1).minus(new BigNumber(val2))
}
// +
export const bignumberPlus = (val1: number | string, val2: number | string) => {
  return new BigNumber(val1).plus(new BigNumber(val2))
}

export const toProcess = (val: string | number, max: string | number) => {
  return bignumberMult(bignumberDiv(val, max), 100)
}

export const toRemainTime = (time: string | number) => {
  const M = 60 * 1000
  const H = 60 * M
  const D = 24 * H
  const day = (Number(time) / D).toFixed()
  const hour = ((Number(time) % D) / H).toFixed()
  const min = (((Number(time) % D) % H) / M).toFixed()
  return `${day}D ${hour}H ${min}M`
}

const DecimalsEnum = {
  ETH: 18,
  DEFAULT: 0,
  SOL: 9,
  DIO: 8,
}
export const token2Decimals = (token?: string) => {
  if (!token) return 0
  const upperToken = token?.toUpperCase() as keyof typeof DecimalsEnum
  return DecimalsEnum[upperToken] || DecimalsEnum.DEFAULT
}

export const toTokenAmount = (amount: number | string, token: string, decimals?: number) => {
  return bignumberDiv(amount || 0, 10 ** (decimals || token2Decimals(token)))
}
export const toAmountToken = (amount: number | string, token: string, decimals?: number) => {
  return bignumberMult(amount || 0, 10 ** (decimals || token2Decimals(token)))
}

export const customFromTime = function (val: string | number, target: string | number, config?: { limit: string }) {
  const dayTarget = dayjs(val)
  if (!dayTarget.isValid()) return val.toString()
  const gapScend = Math.abs(dayTarget.diff(target, 'second'))
  const gapMinute = Math.abs(dayTarget.diff(target, 'minute'))
  const gapDay = Math.abs(dayTarget.diff(target, 'day'))
  const gapHour = Math.abs(dayTarget.diff(target, 'hour'))
  const gapYear = Math.abs(dayTarget.diff(target, 'year'))
  const limiDay = config?.limit === 'day'
  if (gapYear) return dayTarget.utc().format(limiDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm')
  if (gapDay >= 1) return `${gapDay}D ${gapHour % 24}H ${gapMinute % 60}M`
  if (gapHour >= 1) return `${gapHour}H ${gapMinute % 60}M`
  if (gapMinute > 1) return `${gapMinute} minutes`
  if (gapMinute === 1) return '1 minute'
  if (gapScend < 60) return `${gapScend || '1'} secs`
  return dayTarget.from(dayjs(target), true)
}

export const signatureMsg = (msg: any, customMsg?: string): string => {
  const HmacSHA256 = require('crypto-js/hmac-sha256')
  const msgStr = customMsg || `${msg?.tokenaddress}${msg?.address}${msg?.timestamp}`
  return HmacSHA256(msgStr, 'W%yj*.qf3jh.NR%O').toString()
}

export enum Status {
  ComingSoon = 0,
  InProgress = 1,
  End = 2,
}

export const toStatusTime = (
  start?: number,
  end?: number,
  server = Date.now(),
): { status: number; timeStr: string; formatEnd?: string } => {
  if (!start || !end) {
    return {
      status: Status.ComingSoon,
      timeStr: PREPARE,
    }
  }

  // status 0: Coming Soon 1: voting 2: end
  if (server > end) {
    return {
      status: Status.End,
      timeStr: dayjs(end).format('YYYY-MM-DD HH:mm'),
      formatEnd: dayjs(end).format('YYYY-MM-DD HH:mm'),
    }
  }
  if (server < start) {
    return {
      status: Status.ComingSoon,
      timeStr: customFromTime(start, server),
      formatEnd: dayjs(end).format('YYYY-MM-DD HH:mm'),
    }
  }
  return {
    status: Status.InProgress,
    timeStr: customFromTime(end, server, { limit: '' }),
    formatEnd: dayjs(end).format('YYYY-MM-DD HH:mm'),
  }
}

export const toFixed = (value: string | number, fixed?: number) => {
  return new BigNumber(value).toFixed(fixed || 0, 1).replace(/(\.[0-9]*[1-9])0*|(\.0*)/, '$1')
}

export const toFixedInputAmount = (value: string, fixed: number) => {
  const [, float] = value.split('.')
  if (float?.length > fixed) {
    return toFixed(value, fixed)
  } else {
    return value
  }
}

export const toLimitFixed = (value: string | number, fixed?: number) => {
  const [int, float] = String(value).split('.')
  if (Number(int) < 10) {
    return fixed ? toEffectFixed(value.toString(), fixed) : value.toString()
  }
  return toFixed(value, fixed || 2)
}

export const toEffectFixed = (value: string, fixed: number) => {
  if (!value.match(/^\d/)) {
    return value
  }
  const [, float] = value.split('.')
  const effectDecimals = float?.match(/^0+/)?.[0]?.length || 0
  return toFixed(value, fixed + effectDecimals)
}

export const toExponential = ({ amount, fixed, limit = 3 }: { amount: string; fixed?: number; limit?: number }) => {
  const zeroCharCode = 8320
  try {
    if (!amount) return ''
    const [int, float = '0'] = amount.split('.')
    const floatZeroNum = float.match(/^0+/)?.[0]?.length || 0
    const floatZeroArr = floatZeroNum.toString().split('')
    const chartCode =
      floatZeroNum && floatZeroNum > limit ? floatZeroArr.map(i => String.fromCharCode(zeroCharCode + +i)).join('') : ''
    let floatNumber = float.replace(/^0+/, '')
    if (fixed) {
      floatNumber = floatNumber.substring(0, fixed)
      amount = toEffectFixed(amount, fixed)
    }
    return chartCode ? int + '.' + `0${chartCode}${floatNumber}` : amount
  } catch (e) {
    console.log(e)
    return amount
  }
}

export function timeToLocal(originalTime: number) {
  const d = new Date(originalTime)
  return (
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    ) / 1000
  )
}

export const toDecimalsGapAmount = ({
  amount,
  l1TokenDecimals,
  l2TokenDecimals,
}: {
  amount: string | number
  l1TokenDecimals: number
  l2TokenDecimals: number
}) => {
  const decimalsGap = l1TokenDecimals - l2TokenDecimals
  return toEffectFixed(bignumberDiv(amount, 10 ** decimalsGap).toString(), 8)
}

export const isAmount = (amount: string) => {
  if (!amount) return true
  const regex = /^[0-9]+\.?[0-9]*$/
  return regex.test(amount)
}

export const toTokenType = (status: number, forLink = false) => {
  if (status <= 23) {
    return TOKEN_TYPE.VOTE
  }
  if (forLink) return TOKEN_TYPE.LAUNCH
  if (status <= 33) {
    return TOKEN_TYPE.LAUNCH
  }
  return TOKEN_TYPE.SWAP
}

export const toUSD = (value: number | string, fixed?: number) => {
  const bigVal = new BigNumber(value)
  let isMillion = false
  let isBillion = false
  if (bigVal.gt(10 ** 9)) {
    // B
    value = bignumberDiv(value, 10 ** 9)
    isBillion = true
  } else if (bigVal.gt(10 ** 6)) {
    // M
    value = bignumberDiv(value, 10 ** 6)
    isMillion = true
  }
  const unit = isBillion ? ' B' : isMillion ? ' M' : ''
  return '$ ' + (fixed !== undefined ? toFixed(value, fixed) : value) + unit
}
