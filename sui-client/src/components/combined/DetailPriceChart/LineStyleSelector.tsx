import { useControllableValue, useLocalStorageState } from 'ahooks'
import classNames from 'classnames'
import React from 'react'

export enum LineStyle {
  Line = 'Line',
  Area = 'Area',
  Candles = 'Candles',
}

const Options = [
  // {
  //   label: LineStyle.Line,
  //   icon: (
  //     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="1em" height="1em">
  //       <path
  //         fill="currentColor"
  //         d="m25.39 7.31-8.83 10.92-6.02-5.47-7.16 8.56-.76-.64 7.82-9.36 6 5.45L24.61 6.7l.78.62Z"></path>
  //     </svg>
  //   ),
  //   value: LineStyle.Line,
  // },
  {
    label: LineStyle.Area,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="1em" height="1em">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="m25.35 5.35-9.5 9.5-.35.36-.35-.36-4.65-4.64-8.15 8.14-.7-.7 8.5-8.5.35-.36.35.36 4.65 4.64 9.15-9.14.7.7ZM2 21h1v1H2v-1Zm2-1H3v1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1V9h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v1H9v1H8v1H7v1H6v1H5v1H4v1Zm1 0v1H4v-1h1Zm1 0H5v-1h1v1Zm1 0v1H6v-1h1Zm0-1H6v-1h1v1Zm1 0H7v1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v1H9v1H8v1H7v1h1v1Zm1 0v1H8v-1h1Zm0-1H8v-1h1v1Zm1 0H9v1h1v1h1v-1h1v1h1v-1h1v1h1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v1H9v1h1v1Zm1 0v1h-1v-1h1Zm0-1v-1h-1v1h1Zm0 0v1h1v1h1v-1h-1v-1h-1Zm6 2v-1h1v1h-1Zm2 0v1h-1v-1h1Zm0-1h-1v-1h1v1Zm1 0h-1v1h1v1h1v-1h1v1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v1h-1v1h-1v1h-1v1h1v1Zm1 0h-1v1h1v-1Zm0-1h1v1h-1v-1Zm0-1h1v-1h-1v1Zm0 0v1h-1v-1h1Zm-4 3v1h-1v-1h1Z"></path>
      </svg>
    ),
    value: LineStyle.Area,
  },
  {
    label: LineStyle.Candles,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="1em" height="1em" fill="currentColor">
        <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z"></path>
        <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z"></path>
        <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z"></path>
        <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z"></path>
      </svg>
    ),
    value: LineStyle.Candles,
  },
]

const ShortcutLineStyles = 'x-line-styles'
const DefaultShortcutLineStyles = [LineStyle.Area, LineStyle.Candles]

const LineStyleSelector: React.FC<{
  value?: LineStyle
  defaultValue?: number
  onChange?: (x: LineStyle) => void
}> = props => {
  const [value, setValue] = useControllableValue(props, {
    defaultValue: LineStyle.Line,
  })
  const [shortcutAbbrs, setShortcutAbbrs] = useLocalStorageState(ShortcutLineStyles, {
    defaultValue: DefaultShortcutLineStyles,
  })
  const shortcutOptions = Options.filter(x => (shortcutAbbrs || []).includes(x.value))
  const currentOption = Options.find(x => x.value === value)

  return (
    <ul className="flex items-center">
      {shortcutOptions.map(v => {
        return (
          <li
            key={v.value}
            title={v.label}
            className={classNames('px-1 h-[30px] mx-1 rounded-[10px] flex items-center justify-center cursor-pointer', [
              value === v.value ? 'text-gray-10 linear-bg' : 'text-gray-3 hover:bg-gray-700',
            ])}
            onClick={() => setValue(v.value)}>
            <span className="text-2xl">{v.icon}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default LineStyleSelector
