import Button from '@/components/base/Button'
import {
  bignumberDiv,
  bignumberMult,
  toFixed,
  token2Decimals,
  toProcess,
  toRemainTime,
  toTokenAmount,
  toStatusTime,
  toLimitFixed,
  toExponential,
  toTokenType,
  toDecimalsGapAmount,
} from '@/utils/string'
import Image from 'next/image'
import { useCallback, useMemo } from 'react'
import './index.scss'
import Linker from '@/components/base/Linker'
import { Vote } from '@/dataApi/Vote'
import { Launch } from '@/dataApi/Launch'
import { linkDetail } from '@/utils/url'
import { DEFAULT_TOKEN_ICON, FINISHED, PREPARE, TOKEN_TYPE } from '@/constants'

function Card<T extends Vote | Launch>(props: T & { key?: string }) {
  const { Title, TokenAddress, Image: meta, type, Status } = props
  const isVote = type === TOKEN_TYPE.VOTE
  const isLaunch = type === TOKEN_TYPE.LAUNCH
  const statusRecord = useMemo(() => {
    if (props) {
      const t = isVote ? [props.VoteStart, props.VoteEnd] : [props.LaunchStart, props.LaunchEnd]
      return toStatusTime(...t, props.ServerTime)
    } else {
      return {
        status: 0,
        timeStr: PREPARE,
      }
    }
  }, [props, isVote])

  const renderVote = useMemo(() => {
    if (!isVote) return ''
    const isFinish = statusRecord.status === 2
    const isPre = statusRecord.status === 0

    return (
      <>
        {!isFinish ? (
          <div className="remain-time vote-time">
            <Image src={`/img/remain.svg`} alt="remain" width={16} height={16} />
            <span className="linear-font">{isPre ? PREPARE : statusRecord.timeStr}</span>
          </div>
        ) : (
          ''
        )}
        <div className="vote">
          <p className="supply">
            Power Capacity
            <span>
              {bignumberMult(toTokenAmount(props?.TotalSupply, props?.TokenAddress, props?.Decimals), props?.Ratio)}
            </span>
          </p>
          <progress max="100" value={toProcess(props?.TotalL1Amount || 0, props?.L1TokenAmount || 100)}></progress>
          <div className="unit">
            <Image src={`/img/${props?.L1Token?.toLocaleUpperCase()}.svg`} alt="unit" width={12} height={18} />
            <span>
              {toFixed(toTokenAmount(props?.TotalL1Amount, props?.L1Token), 4)} /{' '}
              {toFixed(toTokenAmount(props?.L1TokenAmount, props?.L1Token), 4)}
            </span>
          </div>
          <Button type="outline">{isFinish ? FINISHED : isPre ? statusRecord.timeStr : 'Boost'}</Button>
        </div>
      </>
    )
  }, [statusRecord, isVote])

  const renderLaunch = useMemo(() => {
    if (!isLaunch) return ''
    const isFinish = statusRecord.status === 2
    const isPre = statusRecord.status === 0

    return (
      <>
        <div className="remain-time launch-time">
          {!isFinish ? (
            <>
              <Image src={`/img/remain2.svg`} alt="remain" width={16} height={16} />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-f to-gold-t">
                {isPre ? PREPARE : statusRecord.timeStr}
              </span>
            </>
          ) : (
            <>
              <Image src="/img/finished.svg" alt="remain" width={16} height={16} />
              <span className="text-[#2D2E36]">{FINISHED}</span>
            </>
          )}
        </div>
        <div className="vote">
          <div className="unit">
            Price :&ensp;
            {/* <Image src={`/img/${props?.L1Token?.toLocaleUpperCase()}.svg`} alt="unit" width={12} height={18} /> */}
            <span>
              {toExponential({
                amount: toDecimalsGapAmount({
                  amount: props?.L1Price || 0,
                  l1TokenDecimals: token2Decimals(props?.L1Token),
                  l2TokenDecimals: props?.Decimals || 0,
                }),
                fixed: 2,
                limit: 8,
              })}{' '}
              {props?.L1Token}
            </span>
          </div>
        </div>
      </>
    )
  }, [statusRecord, isLaunch])

  return (
    <Linker href={linkDetail(TokenAddress, toTokenType(Status, true))} className="card">
      <div className="meta">
        <img src={meta || DEFAULT_TOKEN_ICON} alt="card" />
      </div>
      <p className="name">
        <span className="line-clamp inline-block max-w-[150px]">{Title}</span>@{TokenAddress}
      </p>
      {renderVote}
      {renderLaunch}
    </Linker>
  )
}
export default Card
