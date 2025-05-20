'use client'
import React from 'react'
import Image from 'next/image'
import Avatar from '@/components/combined/Avatar'
import { useRequest } from 'ahooks'
import Linker from '@/components/base/Linker'
import { linkDetail } from '@/utils/url'
import { useFavs } from '@/hooks/useFavs'
import Like from '../Like'
import ExploreAPI from '@/dataApi/Explore'
import {
  toDecimalsGapAmount,
  toEffectFixed,
  toExponential,
  token2Decimals,
  toTokenAmount,
  toTokenType,
  toUSD,
} from '@/utils/string'
import AdaptiveText from '@/components/base/AdaptiveText'
import classNames from 'classnames'

const Top1s = () => {
  const { data: userFavs } = useFavs()
  const { data } = useRequest(async () => {
    try {
      const res = await ExploreAPI.getTop1()
      return res.data || []
    } catch (err) {
      console.log(err)
    }
    return []
  })

  return (
    <ul className="flex flex-col gap-5">
      {data?.map((item, i) => {
        let amountLabel
        let amountVal
        switch (i) {
          case 0:
            amountLabel = 'Market CAP'
            amountVal = toUSD(item.MarketCap, 2)
            break
          case 1:
            amountLabel = 'Price(USDT)'
            amountVal = toUSD(item.L1Price || '0', 2)
            break
          case 2:
            amountLabel = '24H Volume'
            amountVal = toUSD(item.TVL24H || '0', 2)
            break
        }
        return (
          <li key={item.TokenAddress} className="relative">
            <Linker
              className="flex gap-[20px] px-6 py-5 rounded-xl bg-white/[0.06] min-h-[232px]"
              href={linkDetail(item.TokenAddress, toTokenType(item.Status, true))}>
              <Like
                className="absolute top-5 left-5"
                tokenaddress={item?.TokenAddress}
                status={userFavs?.some(i => i.TokenAddress === item?.TokenAddress) ? 1 : 0}
              />
              <Avatar className="w-[200px]" data={item} rank={1} />
              <div className="flex-1 pt-4 text-sm text-white/70">
                <p className="flex items-center mb-4 py-1 px-2 leading-7 bg-black/20 rounded-lg">
                  <Image className="mr-2" src="/img/star.svg" alt="star" width={20} height={20} />
                  <span className="flex-1">{amountLabel}</span>
                  <span
                    className={classNames(
                      !i ? 'w-[140px]' : i === 2 ? 'w-[130px]' : 'w-[160px]',
                      'inline-block text-xl text-right text-white font-semibold',
                    )}>
                    <AdaptiveText text={amountVal || ''} />
                  </span>
                </p>
                <p className="mb-4 break-all">{item?.Description}</p>
              </div>
            </Linker>
          </li>
        )
      })}
    </ul>
  )
}

export default Top1s
