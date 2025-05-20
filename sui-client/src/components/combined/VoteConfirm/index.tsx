'use client'
import Button from '@/components/base/Button'
import './index.scss'
import { Vote } from '@/dataApi/Vote'
import { Launch } from '@/dataApi/Launch'
import { forwardRef, useEffect, useState } from 'react'
import { DEFAULT_TOKEN_ICON } from '@/constants'

type VoteConfirmProps = {
  detail: Vote | Launch
  voteNumber: string
  gas?: string
  loading?: boolean
  onConfirm: () => void
}
const VoteConfirm = forwardRef<HTMLDivElement, VoteConfirmProps>((props, ref: any) => {
  const { detail, voteNumber, loading: propLoading, onConfirm, gas } = props
  const [innerLoading, setLoading] = useState(false)
  const loading = propLoading || innerLoading

  useEffect(() => {
    if (ref && ref.current) {
      ref.current.setLoading = (status: boolean) => {
        setLoading(status)
      }
    }
  }, [ref.current])

  return (
    <div className="vote-confirm">
      <div className="vote-header">
        <img src={detail?.Image || DEFAULT_TOKEN_ICON} alt="vote" />
        <div className="info">
          <p className="name">
            <span className="line-clamp">{detail.Title}</span>@{detail.TokenAddress}
          </p>
          {/* <p>Dancing Guru</p> */}
        </div>
      </div>
      <div className="vote-item">
        Amount
        <span>
          {voteNumber} {detail?.L1Token.toUpperCase()}
        </span>
      </div>
      <div className="vote-item">
        GAS Fee
        <span>
          {gas} {detail?.L1Token.toUpperCase()}
        </span>
      </div>
      <div className="line"></div>
      <Button className="vote-btn" loading={loading} disabled={loading} onClick={() => onConfirm && onConfirm()}>
        Confirm
      </Button>
    </div>
  )
})

VoteConfirm.displayName = 'voteConfirm'

export default VoteConfirm
