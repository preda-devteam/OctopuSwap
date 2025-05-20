'use client'
import UserAPI from '@/dataApi/User'
import toasty from '@/components/base/Toast'
import { signatureMsg } from '@/utils/string'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { useDioxAddressContext } from '@/hooks/useDioxAddress'

interface LikeProps {
  tokenaddress: string
  status: number
  className?: string
  onToggle?: (status: boolean) => void
}
const Like = ({ status, tokenaddress, className, onToggle }: LikeProps) => {
  const { address, bindAppAddress } = useDioxAddressContext()
  const [isLike, setIsLike] = useState<boolean>(!!status)
  useEffect(() => {
    setIsLike(!!status)
  }, [status])
  const toggleLike = async (e: any) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      if (!address) {
        return bindAppAddress && bindAppAddress()
      }
      const msg = {
        address: address?.address,
        tokenaddress,
        action: isLike ? 'del' : 'add',
        timestamp: Date.now(),
      }
      const res = await UserAPI.toggleFavorite({
        ...msg,
        signature: signatureMsg(msg),
      })
      if (!res.code) {
        setIsLike(!isLike)
        toasty({ content: 'success' })
        onToggle && onToggle(!isLike)
      }
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <img
      className={classNames(className, 'cursor-pointer')}
      src={`/img/${isLike ? 'dislike' : 'like'}.svg`}
      alt="like"
      width={24}
      height={24}
      onClick={toggleLike}
    />
  )
}

export default Like
