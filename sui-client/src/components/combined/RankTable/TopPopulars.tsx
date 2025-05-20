'use client'
import React from 'react'
import Avatar from '@/components/combined/Avatar'
import Records from '@/components/combined/Records'
import { useRequest } from 'ahooks'
import Linker from '@/components/base/Linker'
import { linkDetail } from '@/utils/url'
import Like from '../Like'
import { useFavs } from '@/hooks/useFavs'
import ExploreAPI from '@/dataApi/Explore'
import {
  toDecimalsGapAmount,
  toExponential,
  toFixed,
  token2Decimals,
  toTokenAmount,
  toTokenType,
  toUSD,
} from '@/utils/string'

const TopPopulars = () => {
  const { data: userFavs } = useFavs()
  const { data, loading } = useRequest(async () => {
    try {
      const res = await ExploreAPI.getPopularity()
      return res.data || []
    } catch (err) {
      console.log(err)
    }
  })

  return (
    <ul className="grid grid-cols-2 gap-5">
      {data?.map((item, i) => {
        return (
          <li key={item.TokenAddress} className="relative">
            <Linker
              className="block w-full px-5 py-[30px] rounded-xl bg-white/[0.06] min-h-[356px]"
              href={linkDetail(item.TokenAddress, toTokenType(item.Status, true))}>
              <Like
                className="absolute top-5 left-5"
                tokenaddress={item?.TokenAddress}
                status={userFavs?.some(i => i.TokenAddress === item?.TokenAddress) ? 1 : 0}
              />
              <Avatar data={item} className="mb-6" rank={i + 1} />
              <Records holders={item.Holders.toString()} marketCAP={toUSD(item.MarketCap || '0', 2)} />
            </Linker>
          </li>
        )
      })}
    </ul>
  )
}

export default TopPopulars
