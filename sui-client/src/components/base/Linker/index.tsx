'use client'
import React, { useCallback, useMemo } from 'react'
import { seesaw } from '@/utils/string'
import clzz from 'classnames'
import Link from 'next/link'

export interface LinkerProps extends StyleComponent {
  isHash?: boolean // <123:321>
  isAddress?: boolean // [123:321]
  isDApp?: boolean // symbol:dapp
  isToken?: boolean // symbol:token
  text?: string
  children?: React.ReactNode
  cancelBubble?: boolean
  href: string
  target?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => false | true | undefined
}
export default function Linker(props: LinkerProps) {
  const { className, style, children, href, isHash, isAddress, text, target, isDApp, isToken } = props
  const linkClass = useMemo(() => {
    return clzz({ 'font-mono': isHash || isAddress }, className, 'linker text-primary cursor-pointer inline-block')
  }, [isHash, className])

  const renderContent = useMemo(() => {
    if (children !== undefined) {
      return children
    }
    const str = text || String(href)
    if (isHash) {
      return seesaw({ raw: str, isHash: true })
    }
    if (isToken) {
      const [symbol, type = 'token'] = str.split(':')
      return (
        <>
          <span className="text-[16px] font-mono !text-primary">{symbol}</span>
          <span className="text-desc h-[21px] inline-flex bg-[#E5E6EB] rounded-[4px] px-[6px] ml-[8px] text-[15px] items-center justify-center ">
            {type}
          </span>
        </>
      )
    }
    if (isAddress) {
      return seesaw({ raw: str, isAddress: true })
    }
    return str
  }, [children, isHash, text, href, isDApp, isToken])

  return (
    <Link style={style} className={linkClass} href={String(href)} target={target} rel="noopener noreferrer">
      {renderContent}
    </Link>
  )
}
