import {
  bignumberMult,
  prettyNumber,
  toEffectFixed,
  toLimitFixed,
  toTokenAmount,
  toTokenType,
  toUSD,
} from '@/utils/string'
import './index.scss'
import UserAPI from '@/dataApi/User'
import { getAddressFromCookie } from '@/utils/server'
import { DEFAULT_TOKEN_ICON } from '@/constants'
import Linker from '@/components/base/Linker'
import { linkDetail } from '@/utils/url'

const BalanceList = async () => {
  const initAddr = getAddressFromCookie()
  if (!initAddr) return ''
  const res = await UserAPI.getTokenBalance(initAddr)
  // console.log(res, initAddr)
  const tokens = res.data || []

  return (
    <div className="balance-list">
      {!tokens.length ? (
        <div className="empty">
          <img src="/img/not-found.svg" alt="empty" width={200} height={200} />
        </div>
      ) : (
        ''
      )}
      {tokens.map(i => {
        const tokenAmount = toTokenAmount(i.Balance, '', i.Decimals)
        return (
          <Linker
            href={linkDetail(i.TokenAddress, toTokenType(i.Status, true))}
            className="balance-item"
            key={i.TokenAddress}>
            <img src={i.Image || DEFAULT_TOKEN_ICON} alt="balance" />
            <div className="info">
              <p className="line-clamp name">{i.TokenAddress}</p>
            </div>
            <div className="amount">
              <p>{prettyNumber(tokenAmount)}</p>
              <p className="font-[400]">≈ {toUSD(toLimitFixed(bignumberMult(tokenAmount, i.L1Price)), 2)}</p>
            </div>
          </Linker>
        )
      })}
    </div>
  )
}

export default BalanceList
