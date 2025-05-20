'use client'
import { useRequest } from 'ahooks'
import React, { useEffect, useMemo, useState } from 'react'
import Table from 'rc-table'
import Like from '../Like'
import './index.scss'
import Avatar from '../Avatar'
import classNames from 'classnames'
import ExploreAPI, { ExploreItem } from '@/dataApi/Explore'
import { useFavs } from '@/hooks/useFavs'
import AdaptiveText from '@/components/base/AdaptiveText'
import {
  toDecimalsGapAmount,
  toEffectFixed,
  toExponential,
  toFixed,
  token2Decimals,
  toTokenAmount,
  toTokenType,
  toUSD,
} from '@/utils/string'
import Linker from '@/components/base/Linker'
import { linkDetail } from '@/utils/url'
import ReactLoading from 'react-loading'
import BigNumber from 'bignumber.js'

function RankTable() {
  const { data: userFavs } = useFavs()
  const [sortKey, setSortKey] = useState<keyof ExploreItem>()
  const [sortType, setSortType] = useState(0) // 0 unset  1 asc 2 desc
  const { data, loading } = useRequest(async () => {
    try {
      const res = await ExploreAPI.gettop100()
      return res.data || []
    } catch (err) {
      console.log(err)
    }
  })

  const changeSort = (key: keyof ExploreItem) => {
    if (sortKey === key) {
      let nextSortType = 0
      switch (sortType) {
        case 0:
          nextSortType = 1
          break
        case 1:
          nextSortType = 2
          break
        case 2:
          nextSortType = 0
          break
      }
      setSortType(nextSortType)
    } else {
      setSortKey(key)
      setSortType(1)
    }
  }

  const renderCustomRow = ({ title, dataIndex }: { title: string; dataIndex: keyof ExploreItem }) => {
    const sortImg = dataIndex !== sortKey || sortType === 0 ? 'sort' : sortType === 1 ? 'asc' : 'desc'
    return (
      <div className="flex justify-center items-center cursor-pointer" onClick={() => changeSort(dataIndex)}>
        {title}
        <img src={`/img/${sortImg}.svg`} alt="sort" />
      </div>
    )
  }

  const sortedData = useMemo(() => {
    if (!data || !data.length) return []
    if (!sortKey || !sortType) return data
    return [...data].sort((a, b) => {
      const numberA = new BigNumber(a[sortKey] || 0)
      const numberB = new BigNumber(b[sortKey] || 0)
      if (numberA.lt(numberB)) {
        return sortType === 1 ? -1 : 1
      } else if (numberA.gt(numberB)) {
        return sortType === 1 ? 1 : -1
      } else {
        return 0
      }
    })
  }, [sortKey, sortType, data])

  // console.log(sortedData)

  return (
    <div className="w-full flex justify-center">
      {!loading ? (
        <Table
          className="rank-table w-full"
          data={sortedData}
          rowKey={item => item.TokenAddress}
          columns={[
            {
              title: '#\tName',
              dataIndex: 'Title',
              width: '35%',
              render: (v, data, i) => {
                return (
                  <div className="pl-[30px] flex items-center">
                    <Like
                      tokenaddress={data.TokenAddress}
                      status={userFavs?.some(i => i.TokenAddress === data?.TokenAddress) ? 1 : 0}
                    />
                    <span
                      className={classNames(
                        'mx-4 block w-[34px] h-5 text-center text-[12px] leading-[25px]',
                        !i ? 'rank-king' : 'rank-other',
                      )}>
                      {!i ? null : i + 1}
                    </span>
                    <Linker href={linkDetail(data.TokenAddress, toTokenType(data.Status, true))}>
                      <Avatar data={data} horizental></Avatar>
                    </Linker>
                  </div>
                )
              },
            },
            {
              title: renderCustomRow({ title: 'Price(USDT)', dataIndex: 'L1Price' }),
              dataIndex: 'L1Price',
              className: 'text-center',
              width: '13%',
              render: (v, data) => {
                return (
                  <p className="w-[155px]">
                    <AdaptiveText text={toUSD(toEffectFixed(data.L1Price || '0', 2))} />
                  </p>
                )
              },
            },
            {
              title: renderCustomRow({ title: '24H Change', dataIndex: 'Change24H' }),
              dataIndex: 'Change24H',
              className: 'text-center',
              width: '13%',
              render: v => {
                const isZero = !v
                const changeStr = String(v || '0')
                const isAdd = !changeStr.match('-')
                return (
                  <p className={classNames(isZero ? '' : isAdd ? 'text-red-500' : 'text-green-600', 'w-[140px]')}>
                    <AdaptiveText
                      text={`${isZero ? '' : isAdd ? '+' : '-'}${' '}${toFixed(changeStr?.replace('-', ''), 2)}%`}
                    />
                  </p>
                )
              },
            },
            {
              title: renderCustomRow({ title: '24H Volume', dataIndex: 'TVL24H' }),
              dataIndex: 'TVL24H',
              className: 'text-center',
              width: '140px',
              render: (v, data) => {
                return (
                  <p className="w-[140px]">
                    <AdaptiveText text={toUSD(data.TVL24H || '0', 2)} />
                  </p>
                )
              },
            },
            {
              title: renderCustomRow({ title: 'Market CAP', dataIndex: 'MarketCap' }),
              dataIndex: 'MarketCap',
              className: 'text-center',
              width: '140px',
              render: (v, data) => {
                return (
                  <p className="w-[140px]">
                    <AdaptiveText text={toUSD(data.MarketCap, 2)} />
                  </p>
                )
              },
            },
            {
              title: renderCustomRow({ title: 'Holders', dataIndex: 'Holders' }),
              dataIndex: 'Holders',
              className: 'text-center',
              width: '140px',
              render: v => {
                return (
                  <p className="w-[140px]">
                    <AdaptiveText text={v} />
                  </p>
                )
              },
            },
          ]}></Table>
      ) : (
        <ReactLoading type="balls" />
      )}
    </div>
  )
}

export default RankTable
