import React, { ComponentProps } from 'react'
import IntervalSelector from './IntervalSelector'
import LineStyleSelector, { LineStyle } from './LineStyleSelector'
import ChartButtons from './ChartButtons'

const ToolBar: React.FC<{
  interval?: number
  onIntervalChange?: (x: number) => void
  lineStyle?: LineStyle
  onLineStyleChange?: (x: LineStyle) => void
  btnsProps?: ComponentProps<typeof ChartButtons>
  expandToolbar?: () => JSX.Element
}> = ({ interval, onIntervalChange, lineStyle, expandToolbar, onLineStyleChange, btnsProps }) => {
  return (
    <aside className="overflow-x-auto overflow-y-clip flex justify-between items-center">
      {expandToolbar ? expandToolbar() : null}
      <IntervalSelector value={interval} onChange={onIntervalChange} />
      <div className="flex-none tool-seperator mx-[5px]"></div>
      <LineStyleSelector value={lineStyle} onChange={onLineStyleChange} />
      <div className="flex-none tool-seperator mx-[5px]"></div>
      <ChartButtons {...btnsProps} />
    </aside>
  )
}

export default ToolBar
