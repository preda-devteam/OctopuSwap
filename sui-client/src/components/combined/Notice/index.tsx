'use client'
import { seesaw, toEffectFixed, toTokenAmount } from '@/utils/string'
import { useEffect, useState } from 'react'
import './index.scss'
import useThrottle from '@/hooks/useThrottle'
import VoteAPI, { ActiveParams, type VoteActive } from '@/dataApi/Vote'
import { customFromTime } from '@/utils/string'

type NoticeProps = {
  delay?: number
} & ActiveParams

const Notice = (props?: NoticeProps) => {
  const { delay = 1500, ...filter } = props || {}
  const [activeIndex, setActiveIndex] = useState(0)
  const [rotate, setRotate] = useState(0)
  const [list, setList] = useState<VoteActive[]>([])
  const [rotateList, setRotateList] = useState<VoteActive[]>([])

  useEffect(() => {
    initList()
  }, [])

  useEffect(() => {
    if (!list.length) return
    const timer = setTimeout(() => {
      updateActiveIndex()
      setTimeout(() => setRotate(rotate + 90), delay)
    }, delay)
    return () => clearTimeout(timer)
  }, [rotate, list, delay])

  const initList = useThrottle(async () => {
    try {
      const res = await VoteAPI.getActive(filter)
      if (res.data) {
        const list = res.data
        setList(list)
        const initList = new Array(4).fill(list[0]).map((i, j) => {
          if (list[j]) {
            return list[j]
          } else {
            return list[j % list.length] || list[0]
          }
        })
        setRotateList(initList)
      }
    } catch (e) {
      // todo
    }
  }, 200)

  const updateActiveIndex = () => {
    const newActiveIndex = activeIndex + 1
    if (newActiveIndex > 3) {
      const nextChangeIndx = newActiveIndex % 4
      rotateList[nextChangeIndx] = list[newActiveIndex % list.length]
      setRotateList([...rotateList])
    }
    setActiveIndex(newActiveIndex)
  }

  const renderAction = (rawIndex: number) => {
    const row = rotateList[rawIndex]
    const isVote = row?.Type === 'Vote'
    const amount =
      isVote || row?.L1To
        ? toTokenAmount(row?.L1Amount, row?.L1Token)
        : toTokenAmount(row?.TokenAmount || '0', '', row?.TokenDecimals || 0)
    let typeName = ''
    switch (row?.Type) {
      case 'Vote':
        typeName = 'Boosted'
        break
      case 'Swap':
      case 'Launch':
        typeName = 'Bought'
        break
    }
    return (
      <>
        {typeName} {toEffectFixed(amount, 2)} {isVote || row?.L1To ? row?.L1Token : row?.TokenAddress}
      </>
    )
  }

  return (
    <div className="notice-container">
      <div className="notice-warp">
        <div className="notice-bg"></div>
        <div className="notice" style={{ transform: `rotateX(${rotate}deg)` }}>
          <div className="notice-content front">
            {rotateList[0] ? (
              <>
                <span>{seesaw({ raw: rotateList[0]?.Address, isAddress: true })}</span>
                <span>{renderAction(0)}</span>
                {/* <span>{rotateList[0]?.TokenAddress}</span> */}
                <span>{customFromTime(rotateList[0]?.L1Timestamp || 0, rotateList[0]?.ServerTime || 0)}</span>
              </>
            ) : (
              ''
            )}
          </div>
          <div className="notice-content bottom">
            <span>{seesaw({ raw: rotateList[1]?.Address, isAddress: true })}</span>
            <span>{renderAction(1)}</span>
            {/* <span>{rotateList[1]?.TokenAddress}</span> */}
            <span>{customFromTime(rotateList[1]?.L1Timestamp || 0, rotateList[1]?.ServerTime || 0)}</span>
          </div>
          <div className="notice-content back">
            <span>{seesaw({ raw: rotateList[2]?.Address, isAddress: true })}</span>
            <span>{renderAction(2)}</span>
            {/* <span>{rotateList[2]?.TokenAddress}</span> */}
            <span>{customFromTime(rotateList[2]?.L1Timestamp || 0, rotateList[2]?.ServerTime || 0)}</span>
          </div>
          <div className="notice-content top">
            <span>{seesaw({ raw: rotateList[3]?.Address, isAddress: true })}</span>
            <span>{renderAction(3)}</span>
            {/* <span>{rotateList[3]?.TokenAddress}</span> */}
            <span>{customFromTime(rotateList[3]?.L1Timestamp || 0, rotateList[3]?.ServerTime || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Notice
