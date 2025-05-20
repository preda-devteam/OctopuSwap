/* eslint-disable react/prop-types */
'use client'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import VoteAPI, { Vote } from '@/dataApi/Vote'
import LaunchAPI, { Launch } from '@/dataApi/Launch'
import useThrottle from '@/hooks/useThrottle'
import Card from '@/components/combined/Card'
import './index.scss'
import classNames from 'classnames'

function RecommonendList<T extends Vote | Launch>({ type }: { type: T['type'] }) {
  const [voteList, setVoteList] = useState<Array<Vote | Launch>>([])
  const [translateLeftCount, setTranslateLeftCount] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    renderVoteList()
  }, [])

  useEffect(() => {
    if (translateLeftCount) {
      setTimeout(() => {
        startLoopCard()
      }, 2000)
    }
  }, [translateLeftCount])

  const startLoopCard = () => {
    const targetEl = listRef.current
    if (targetEl) {
      const totalCount = (targetEl.scrollWidth - targetEl.offsetWidth) / 325
      if (totalCount < 0) return
      if (translateLeftCount > Math.floor(totalCount) - 2) {
        setVoteList([...voteList, ...voteList])
      }
      const nexLeft = translateLeftCount * 325
      targetEl.style.transition = 'transform 0.5s ease-in-out'
      setTranslateLeftCount(translateLeftCount + 1)
      targetEl.style.transform = `translateX(-${nexLeft}px)`
    } else {
      setTimeout(() => {
        startLoopCard()
      }, 200)
    }
  }

  const renderVoteList = useThrottle(async () => {
    try {
      const res = await (type === 'vote' ? VoteAPI.getList(1) : LaunchAPI.getList(1))
      if (res?.data) {
        setVoteList(res.data)
        if (type === 'vote') {
          setTranslateLeftCount(1)
        }
      }
    } catch (err) {
      // todo
    }
  }, 200)

  return (
    <div className="vote-warp">
      <div
        ref={listRef}
        className={classNames('vote-list flex gap-[25px]', type === 'vote' ? '' : 'flex-wrap  overflow-hidden')}>
        {voteList.map((item, index) => {
          item.type = type
          return <Card<T> {...(item as T)} key={item.TokenAddress + index} />
        })}
      </div>
    </div>
  )
}

export default observer(RecommonendList)
