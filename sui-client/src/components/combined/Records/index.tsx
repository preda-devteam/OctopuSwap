import Image from 'next/image'
import React from 'react'
import SvgHolders from '@/../public/img/holders.svg'
import SvgMarketCAP from '@/../public/img/market-cap.svg'
import AdaptiveText from '@/components/base/AdaptiveText'

function Records({
  holders,
  marketCAP,
}: React.PropsWithChildren<{
  holders: string
  marketCAP: string
}>) {
  const imgs = [SvgHolders, SvgMarketCAP]
  const values = [holders, marketCAP]

  return (
    <ul className="text-sm text-white/70 flex flex-col gap-5">
      {['Holders', 'Market CAP'].map((x, i) => {
        return (
          <li key={x} className="flex items-center h-12 bg-black/[0.12] rounded-full">
            <i className="mr-2 w-[44px] h-[44px] rounded-full bg-[#E2FAFF33] flex items-center justify-center">
              <Image src={imgs[i]} alt="x"></Image>
            </i>
            <span className="mr-2">{x}</span>
            <span className="flex-1  text-white line-clamp leading-none pr-[20px] text-right">
              <AdaptiveText text={values[i]} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default Records
