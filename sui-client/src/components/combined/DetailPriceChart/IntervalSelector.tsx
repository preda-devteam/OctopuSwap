import React, { useState } from 'react'
import Select from 'rc-select'
import 'rc-select/assets/index.css'
import { useControllableValue, useLocalStorageState } from 'ahooks'
import classNames from 'classnames'

const Options = [
  { label: '4s', abbr: '4s', value: 4 },
  { label: '10s', abbr: '10s', value: 10 },
  { label: '30s', abbr: '30s', value: 30 },
  { label: '1m', abbr: '1m', value: 60 },
  { label: '5m', abbr: '5m', value: 60 * 5 },
  { label: '10m', abbr: '10m', value: 60 * 10 },
  { label: '15m', abbr: '15m', value: 60 * 15 },
  { label: '30m', abbr: '30m', value: 60 * 30 },
  { label: '1h', abbr: '1h', value: 3600 },
  { label: '2h', abbr: '2h', value: 3600 * 2 },
  { label: '4h', abbr: '4h', value: 3600 * 4 },
  { label: '8h', abbr: '8h', value: 3600 * 8 },
  { label: '12h', abbr: '12h', value: 3600 * 12 },
  { label: '1d', abbr: '1d', value: 3600 * 24 },
  { label: '3d', abbr: '3d', value: 3600 * 24 * 3 },
  { label: '5d', abbr: '5d', value: 3600 * 24 * 5 },
  { label: '1w', abbr: '1w', value: 3600 * 24 * 7 },
]

const DefaultShortcutIntervalAbbrs = ['10s', '1m', '5m', '1h']

const IntervalSelector: React.FC<{
  value?: number
  defaultValue?: number
  onChange?: (x: number) => void
}> = props => {
  const [value, setValue] = useControllableValue(props, {
    defaultValue: 60,
  })
  const shortcutIntervals = Options.filter(x => (DefaultShortcutIntervalAbbrs || []).includes(x.abbr))
  const currentInterval = Options.find(x => x.value === value)

  return (
    <ul className="flex justify-between flex-1 items-center">
      {shortcutIntervals.map(v => {
        return (
          <li
            key={v.value}
            className={classNames('px-1.5 h-[30px] rounded-[10px] flex items-center justify-center cursor-pointer', [
              value === v.value ? 'text-gray-10 linear-bg' : 'text-gray-3 hover:bg-gray-700',
            ])}
            onClick={() => setValue(v.value)}>
            {v.abbr}
          </li>
        )
      })}
      <li className="relative min-w-[50px]">
        <span className="absolute w-[100%] text-right px-0.5 h-full left-0 top-0 inline-flex items-center justify-center cursor-pointer pointer-events-none">
          {currentInterval ? <span className="mr-1">{currentInterval.abbr}</span> : null}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 8" width="16" height="8">
            <path
              fill="currentColor"
              d="M0 1.475l7.396 6.04.596.485.593-.49L16 1.39 14.807 0 7.393 6.122 8.58 6.12 1.186.08z"></path>
          </svg>
        </span>
        <Select value={value} className="interval-selector" onChange={setValue} options={Options} />
      </li>
    </ul>
  )
}

export default IntervalSelector
