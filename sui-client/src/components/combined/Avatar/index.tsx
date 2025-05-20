import classNames from 'classnames'
import React from 'react'
import { ExploreItem } from '@/dataApi/Explore'

const Avatar: React.FC<{
  rank?: number
  horizental?: boolean
  className?: string
  data?: ExploreItem
}> = ({ rank, horizental = false, className, data }) => {
  const Wrapper = horizental ? 'div' : React.Fragment

  return (
    <div className={classNames(className, 'text-center')}>
      <span
        className={classNames('inline-flex align-middle flex-col items-center', {
          'mb-5': !horizental,
        })}>
        {rank ? (
          <span
            className={classNames(
              'block w-[34px] h-5 text-[12px] leading-[25px]',
              rank === 1 ? 'rank-king' : 'rank-other',
            )}>
            {rank === 1 ? '' : rank}
          </span>
        ) : null}
        <img
          className="rank-avatar -mt-1 w-16 h-16 border-[3px] border-solid border-white/80 rounded-full object-cover"
          src={data?.Image || '/img/default-address.png'}
          alt="avatar"
          width={64}
          height={64}
        />
      </span>
      <Wrapper className="ml-[12px] inline-flex align-middle flex-col">
        <p className="mb-1 text-lg text-white flex items-center justify-center">
          <span className="inline-block max-w-[90px] line-clamp">{data?.Title}</span>
          <span className="text-[#888]">@{data?.TokenAddress}</span>
        </p>
        <p className={classNames('text-sm text-[#888] line-clamp-1 h-[20px]', { 'text-left': horizental })}>
          {/* <span className="mr-1 w-5">
            <Image className="inline" src={SvgFemale} alt="female"></Image>
          </span> */}
          <span>{data?.Slogan}</span>
        </p>
      </Wrapper>
    </div>
  )
}

export default Avatar
