'use client'
import Tabs from '@/components/base/Tabs'
import { bignumberDiv, customFromTime, seesaw, toEffectFixed, toTokenAmount, toTokenType } from '@/utils/string'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './index.scss'
import { useDioxAddressContext } from '@/hooks/useDioxAddress'
import UserAPI, { UserFavorite } from '@/dataApi/User'
import clss from 'classnames'
import Like from '../Like'
import VoteAPI, { VoteActive } from '@/dataApi/Vote'
import useThrottle from '@/hooks/useThrottle'
import { DEFAULT_ADDRESS_ICON, DEFAULT_TOKEN_ICON, TOKEN_TYPE } from '@/constants'
import Linker from '@/components/base/Linker'
import { linkDetail } from '@/utils/url'
import Image from 'next/image'

const RenderFavorite = () => {
  const { address } = useDioxAddressContext()
  const userAddress = address?.address
  const [list, setList] = useState<UserFavorite[]>([])
  const [isEmpty, setIsEmpty] = useState<boolean>(false)
  useEffect(() => {
    if (userAddress) {
      getList(userAddress)
    }
  }, [userAddress])
  const getList = useThrottle(async (address: string) => {
    const res = await UserAPI.getFavorite(address)
    if (res.data) {
      setList(res.data)
      setIsEmpty(!res.data.length)
    } else {
      setIsEmpty(true)
    }
  }, 200)
  const onLikeChange = async (likeStatus: boolean, token: string) => {
    const targetIndex = list.findIndex(t => t.TokenAddress === token)
    if (targetIndex > -1) {
      const newList = [...list]
      newList[targetIndex].likeStatus = !likeStatus
      setList(newList)
      setTimeout(() => {
        if (newList.every(t => t.likeStatus)) {
          setIsEmpty(true)
        }
      }, 200)
    }
  }
  return (
    <div className="favorite">
      {isEmpty ? (
        <div className="empty">
          <Image src="/img/not-found.svg" alt="empty" width={200} height={200} />
        </div>
      ) : (
        list.map(t => {
          return (
            <Linker
              href={linkDetail(t.TokenAddress, toTokenType(t.Status, true))}
              className={clss({ unlike: t.likeStatus }, 'favorite-item')}
              key={t.TokenAddress}>
              <Like
                className="like"
                tokenaddress={t?.TokenAddress}
                status={1}
                onToggle={likeStatus => onLikeChange(likeStatus, t.TokenAddress)}
              />
              <img className="meta" src={t.Image || DEFAULT_TOKEN_ICON} alt="favorite" />
              <div className="info">
                <p className="line-clamp name">{t.Title}</p>
                <p className="addr font-mono">@{t.TokenAddress}</p>
              </div>
              {/* <div className="num">
              {toTokenAmount(t.TotalL1Amount, t.L1Token)} {t.L1Token}
            </div> */}
            </Linker>
          )
        })
      )}
    </div>
  )
}

const RenderActivity = () => {
  const { address } = useDioxAddressContext()
  const userAddress = address?.address
  const [list, setList] = useState<VoteActive[]>([])
  useEffect(() => {
    if (userAddress) {
      getList(userAddress)
    }
  }, [userAddress])
  const getList = useThrottle(async (address: string) => {
    const res = await VoteAPI.getActive({ address })
    if (res.data) {
      setList(res.data)
    }
  }, 200)
  return (
    <div className="user-activity">
      {!list.length ? (
        <div className="empty">
          <Image src="/img/not-found.svg" alt="empty" width={200} height={200} />
        </div>
      ) : (
        ''
      )}
      {list.map(t => {
        const linkType = t.Type === 'Swap' ? TOKEN_TYPE.LAUNCH : (t.Type.toLocaleLowerCase() as TOKEN_TYPE)
        const tokenName = t.TokenAddress.split(':')[0]
        let typeName = ''
        switch (t?.Type) {
          case 'Vote':
            typeName = 'Boosted'
            break
          case 'Launch':
            typeName = 'Bought'
            break
          case 'Swap':
            typeName = 'Bought'
            break
        }
        const isVote = t?.Type === 'Vote'
        const isLauch = t?.Type === 'Launch'
        const isSwap = t?.Type === 'Swap'
        const isSend = t?.L1To && t?.Type === 'Swap'
        const l1Amount = toEffectFixed(toTokenAmount(t?.L1Amount, t?.L1Token), 8)
        const tokenAmount = toEffectFixed(toTokenAmount(t?.TokenAmount || '0', '', t?.TokenDecimals || 0), 8)
        const withToken = isSend ? tokenName : t.L1Token.toUpperCase()
        return (
          <Linker href={linkDetail(t.TokenAddress, linkType)} className="activity-item" key={t.ID}>
            <img className="avatr" src={t.Image || DEFAULT_TOKEN_ICON} alt="activity" />
            <div className="activity-info">
              <p className="line-clamp name">{t.Title}</p>
              <p className="addr font-mono">@{t.TokenAddress.split(':')[0]}</p>
            </div>
            <div className="vote-num">
              {typeName}{' '}
              <span>
                {isVote || isSend ? l1Amount : tokenAmount} {isVote || isSend ? t.L1Token.toUpperCase() : tokenName}
              </span>
              {isLauch || isSwap ? (
                <>
                  <br />
                  with{' '}
                  <span>
                    {isLauch ? `${l1Amount} ${t.L1Token.toUpperCase()}` : ''}
                    {isSwap ? `${isSend ? tokenAmount : l1Amount} ${withToken} ` : ''}
                  </span>
                </>
              ) : (
                ''
              )}
            </div>
            <div className="time">{customFromTime(t.L1Timestamp, t.ServerTime, { limit: 'day' })}</div>
          </Linker>
        )
      })}
    </div>
  )
}

const DetailTabs = () => {
  const [tab, setTab] = useState<string>('favorite')
  const onTabChange = useCallback((newTab: string) => {
    setTab(newTab)
  }, [])

  const renderTabs = useMemo(() => {
    return [
      {
        key: 'favorite',
        label: 'Favorite',
        render: () => <RenderFavorite />,
      },
      {
        key: 'activity',
        label: 'Activity',
        render: () => <RenderActivity />,
      },
    ]
  }, [])
  return <Tabs tabs={renderTabs} defaultKey={tab} callback={onTabChange}></Tabs>
}

export default DetailTabs
