/* eslint-disable react/prop-types */
'use client'
import Button from '@/components/base/Button'
import Tabs from '@/components/base/Tabs'
import {
  bignumberDiv,
  bignumberMult,
  customFromTime,
  seesaw,
  signatureMsg,
  toEffectFixed,
  toExponential,
  toFixed,
  toLimitFixed,
  toTokenAmount,
} from '@/utils/string'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.scss'
import { useParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import TokenAPI, { Thread, ThreadParams, TokenStatus } from '@/dataApi/Token'
import { Address, useDioxAddressContext } from '@/hooks/useDioxAddress'
import VoteAPI, { Vote, VoteActive } from '@/dataApi/Vote'
import { Launch } from '@/dataApi/Launch'
import useThrottle from '@/hooks/useThrottle'
import { DEFAULT_ADDRESS_ICON } from '@/constants'
import Image from 'next/image'
import { useRequest } from 'ahooks'
import ReactLoading from 'react-loading'

interface TabsProp {
  address: Address | null
  tokenaddress?: string
}
const RenderThread = ({ tokenaddress, address }: TabsProp) => {
  const { bindAppAddress } = useDioxAddressContext()
  const threadRef = useRef<HTMLTextAreaElement>(null)
  const [list, setList] = useState<Thread[]>([])
  useEffect(() => {
    getList()
  }, [tokenaddress])

  const addToList = useCallback(
    (msg: Omit<ThreadParams, 'signature'>) => {
      setList([
        {
          TokenAddress: msg.tokenaddress,
          Address: msg.address,
          Content: msg.content,
          CreateTime: msg.timestamp,
          UserName: address?.alias || '',
          UserIconUrl: address?.avatar || '',
        },
        ...list,
      ])
    },
    [list, address],
  )
  const getList = useThrottle(async () => {
    if (!tokenaddress) return
    const res = await TokenAPI.getThread(tokenaddress)
    res.data && setList(res.data)
  }, 200)
  const handlePostThread = useCallback(async () => {
    if (!address) {
      bindAppAddress && bindAppAddress()
      return
    }
    if (threadRef.current && address) {
      const content = threadRef.current.value.trim()
      if (!content) return
      try {
        if (!address?.address || !tokenaddress) return
        const msg = {
          address: address?.address,
          tokenaddress,
          content: encodeURIComponent(content),
          timestamp: Date.now(),
        }
        const res = await TokenAPI.addThread({
          ...msg,
          signature: signatureMsg(msg),
        })
        if (!res.code) {
          msg.content = decodeURIComponent(msg.content)
          addToList(msg)
        }
        threadRef.current.value = ''
      } catch (e) {
        console.log(e)
      }
    }
  }, [threadRef, address, addToList, bindAppAddress])

  return (
    <div className="thread">
      <div className="thread-input">
        <textarea ref={threadRef} maxLength={100} placeholder="Share your comments!"></textarea>
        <Button type="outline" onClick={handlePostThread}>
          Post
        </Button>
      </div>
      {!list.length ? (
        <div className="empty">
          <Image src="/img/not-found.svg" alt="empty" width={200} height={200} />
        </div>
      ) : (
        ''
      )}
      {list.map(t => {
        return (
          <div className="thread-box" key={t.CreateTime}>
            <div className="thread-header">
              <img src={t.UserIconUrl || DEFAULT_ADDRESS_ICON} alt="thread" />
              <span className="line-clamp name">{t.UserName}</span>
              <span className="addr font-mono">{seesaw({ raw: t.Address, isAddress: true })}</span>
              <div className="time">{customFromTime(t.CreateTime, Date.now())}</div>
            </div>
            <div className="thread-content line-clamp-3">{t.Content}</div>
          </div>
        )
      })}
    </div>
  )
}

const RenderActivity = ({ tokenaddress }: TabsProp) => {
  const [list, setList] = useState<VoteActive[]>([])
  useEffect(() => {
    getList()
  }, [tokenaddress])
  const getList = useThrottle(async () => {
    try {
      if (!tokenaddress) return
      const res = await VoteAPI.getActive({ tokenaddress })
      if (res.data) {
        setList(res.data)
      }
    } catch (err) {
      console.log(err)
    }
  }, 200)
  return (
    <div className="activity">
      {!list.length ? (
        <div className="empty">
          <Image src="/img/not-found.svg" alt="empty" width={200} height={200} />
        </div>
      ) : (
        ''
      )}
      {list.map(t => {
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
        const isLauch = t?.Type === 'Launch'
        const isVote = t?.Type === 'Vote'
        const isSwap = t?.Type === 'Swap'
        const isSend = t?.L1To && t?.Type === 'Swap'
        const l1Amount = toFixed(toTokenAmount(t?.L1Amount, t?.L1Token), 8)
        const tokenAmount = toEffectFixed(toTokenAmount(t?.TokenAmount || '0', '', t?.TokenDecimals || 0), 2)
        const withToken = isSend ? tokenName : t.L1Token.toUpperCase()
        return (
          <div className="activity-item" key={t.ID}>
            <img className="avatr" src={t.UserIconUrl || DEFAULT_ADDRESS_ICON} alt="activity" />
            <div className="activity-info">
              <p className="line-clamp name">{t.UserName}</p>
              <p className="addr font-mono">{seesaw({ raw: t.Address, isAddress: true })}</p>
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
          </div>
        )
      })}
    </div>
  )
}

const RenderHolders = ({ unit = '', total, tokenaddress }: TabsProp & { unit?: string; total: string | number }) => {
  const { data: list, loading } = useRequest(
    async () => {
      if (!tokenaddress) {
        return
      }
      const res = await TokenAPI.getHolders(tokenaddress)

      return res.data
    },
    {
      refreshDeps: [tokenaddress],
    },
  )
  return (
    <div className="activity">
      {loading ? (
        <aside className="py-5 flex justify-center">
          <ReactLoading height={16} type="balls" />
        </aside>
      ) : null}
      {!list?.length ? (
        <div className="empty">
          <Image src="/img/not-found.svg" alt="empty" width={200} height={200} />
        </div>
      ) : (
        list?.map((t, i) => {
          const amountToken = toTokenAmount(t.UserTotalAmount, '', t.Decimals)
          const percent = toFixed(bignumberMult(bignumberDiv(t.UserTotalAmount, t.TotalAmount), 100))

          return (
            <div className="activity-item !text-white" key={t.Address}>
              <span className="w-5 mr-[10px] text-[#888] text-center">
                {i < 3 ? <img className="w-[20px] h-[20px]" src={`/img/holder${i + 1}.svg`} alt="holder" /> : i + 1}
              </span>
              <img className="avatr" src={t.UserIconUrl || DEFAULT_ADDRESS_ICON} alt="activity" />
              <div className="activity-info">
                <p className="line-clamp name">{t.UserName}</p>
                <p className="addr font-mono">{seesaw({ raw: t.Address, isAddress: true })}</p>
              </div>
              <div className="flex-1">
                <span>
                  {toLimitFixed(amountToken, 2)}
                  <br />
                  {unit}
                </span>
              </div>
              <div className="w-8 px-1">
                <span>{percent}%</span>
              </div>
              <div className="flex-1 text-right">{toLimitFixed(amountToken, 2)} Credit</div>
            </div>
          )
        })
      )}
    </div>
  )
}

const DetailTabs: React.FC<{
  data: Vote | Launch
  holdable?: boolean
}> = ({ data, holdable }) => {
  const { address } = useDioxAddressContext()
  const { token } = useParams()
  const tokenaddress = decodeURIComponent(token.toString())
  const [tab, setTab] = useState<string>('thread')
  const onTabChange = useCallback((newTab: string) => {
    setTab(newTab)
  }, [])

  const renderTabs = useMemo(() => {
    return [
      {
        key: 'thread',
        label: 'Thread',
        render: () => <RenderThread address={address} tokenaddress={tokenaddress} />,
      },
      {
        key: 'activity',
        label: 'Activity',
        render: () => <RenderActivity address={address} tokenaddress={tokenaddress} />,
      },
      {
        hidden: data.Status < TokenStatus.VOTE_SETTLED && !holdable,
        key: 'holders',
        label: 'Holders',
        render: () => (
          <RenderHolders
            unit={data.TokenAddress}
            total={data.TotalSupply}
            address={address}
            tokenaddress={tokenaddress}
          />
        ),
      },
    ].filter(x => !x.hidden)
  }, [address, tokenaddress])
  return <Tabs tabs={renderTabs} defaultKey={tab} callback={onTabChange}></Tabs>
}

export default observer(DetailTabs)
