import classNames from 'classnames'
import React from 'react'

export enum BtnTypes {
  FullScreen,
  Snapshot,
  Refresh,
}

const Btns = [
  {
    type: BtnTypes.FullScreen,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="1em" height="1em">
        <path
          fill="currentColor"
          d="M8.5 6A2.5 2.5 0 0 0 6 8.5V11h1V8.5C7 7.67 7.67 7 8.5 7H11V6H8.5zM6 17v2.5A2.5 2.5 0 0 0 8.5 22H11v-1H8.5A1.5 1.5 0 0 1 7 19.5V17H6zM19.5 7H17V6h2.5A2.5 2.5 0 0 1 22 8.5V11h-1V8.5c0-.83-.67-1.5-1.5-1.5zM22 19.5V17h-1v2.5c0 .83-.67 1.5-1.5 1.5H17v1h2.5a2.5 2.5 0 0 0 2.5-2.5z"></path>
      </svg>
    ),
    label: 'Full',
  },
  {
    type: BtnTypes.Snapshot,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="1em" height="1em" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.118 6a.5.5 0 0 0-.447.276L9.809 8H5.5A1.5 1.5 0 0 0 4 9.5v10A1.5 1.5 0 0 0 5.5 21h16a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 21.5 8h-4.309l-.862-1.724A.5.5 0 0 0 15.882 6h-4.764zm-1.342-.17A1.5 1.5 0 0 1 11.118 5h4.764a1.5 1.5 0 0 1 1.342.83L17.809 7H21.5A2.5 2.5 0 0 1 24 9.5v10a2.5 2.5 0 0 1-2.5 2.5h-16A2.5 2.5 0 0 1 3 19.5v-10A2.5 2.5 0 0 1 5.5 7h3.691l.585-1.17z"></path>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 1a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"></path>
      </svg>
    ),
    desc: 'Take a snapshot',
  },
  // {
  //   type: BtnTypes.Refresh,
  //   icon: (
  //     <svg
  //       viewBox="64 64 896 896"
  //       focusable="false"
  //       data-icon="reload"
  //       width="0.8em"
  //       height="0.8em"
  //       fill="currentColor"
  //       aria-hidden="true">
  //       <path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"></path>
  //     </svg>
  //   ),
  //   desc: 'Refresh',
  //   hidden: true,
  // },
]

const ChartButtons: React.FC<{
  values?: Record<BtnTypes, boolean>
  onClick?: (x: BtnTypes) => void
}> = ({ values = {}, onClick }) => {
  return (
    <ul className="flex items-center">
      {Btns.map(btn => {
        return (
          <li
            key={btn.type}
            title={btn.desc}
            className={classNames('px-1 h-[30px] rounded-[10px] flex items-center justify-center cursor-pointer', [
              values[btn.type] ? 'text-gray-10 linear-bg' : 'text-gray-3 hover:bg-gray-700',
            ])}
            onClick={() => onClick?.(btn.type)}>
            <span className="text-2xl">{btn.icon}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default ChartButtons
