import React, { useEffect, useRef, useState } from 'react'
import ReactLoading from 'react-loading'
import dayjs from 'dayjs'
import { useRequest, useSize } from 'ahooks'
import {
  createChart,
  ColorType,
  IChartApi,
  UTCTimestamp,
  MouseEventParams,
  LineData,
  AreaData,
  CandlestickData,
  ISeriesApi,
} from 'lightweight-charts'
import ToolBar from './ToolBar'
import './index.scss'
import { BtnTypes } from './ChartButtons'
import classNames from 'classnames'
import { download } from '@/utils/bom'
import { LineStyle } from './LineStyleSelector'
import TokenAPI, { Price } from '@/dataApi/Token'
import {
  bignumberDiv,
  bignumberMinus,
  bignumberMult,
  timeToLocal,
  toDecimalsGapAmount,
  toEffectFixed,
  toExponential,
  toFixed,
  token2Decimals,
} from '@/utils/string'

const DefaultLineOpts = {
  lineWidth: 2 as const,
  lineColor: '#c81cc5',
}

const DetailPriceChart: React.FC<{
  tokenaddress: string
  l1token: string
  decimals: number
  start?: number
  end?: number
  expandToolbar?: () => JSX.Element
  showPrice?: boolean
  L1Price?: string
}> = ({ tokenaddress, l1token, decimals, start, end, expandToolbar, showPrice, L1Price }) => {
  const refChart = useRef<IChartApi>()
  const refChartEl = useRef<null | HTMLDivElement>(null)
  const size = useSize(refChartEl)
  const [interval, setChartInterval] = useState(60)
  const [lineStyle, setLineStyle] = useState(LineStyle.Area)
  const [btnValues, setBtnValues] = useState({} as Record<BtnTypes, boolean>)
  const [lastPrice, setLastPrice] = useState('0')
  const [priceWave, setPriceWave] = useState(0)
  const { data, loading, refresh } = useRequest(
    async () => {
      const res = await TokenAPI.getPrice({ tokenaddress, l1token, interval, start, end })
      const priceList = res?.data as Price[]
      return (
        priceList?.map(({ timestamp, open, high, low, close }) => ({
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          value: Number(close),
          time: Number(timeToLocal(timestamp).toFixed(0)) as UTCTimestamp,
        })) ?? []
      )
    },
    {
      refreshDeps: [interval, l1token, lineStyle, tokenaddress],
      // pollingInterval: 1000,
      // pollingWhenHidden: false,
    },
  )

  const changePrice = (close?: number, open?: number) => {
    const l1TokenDecimals = token2Decimals(l1token)
    if (!data) return
    let prevPrice
    let price
    if (close && open) {
      price = close || 0
      prevPrice = open || 0
    } else {
      const currentItem = data[data.length - 1]
      const prevItem = data[data.length - 2]
      price = currentItem?.value || 0
      prevPrice = prevItem?.value || 0
    }
    const decimalsAmount = toDecimalsGapAmount({
      amount: price?.toString() || '0',
      l1TokenDecimals,
      l2TokenDecimals: decimals,
    })
    const exponentialPrice = toExponential({
      amount: decimalsAmount,
      fixed: 4,
    })
    setLastPrice(exponentialPrice)
    const wave = parseFloat(bignumberDiv(bignumberMinus(price, prevPrice).toString(), prevPrice))
    setPriceWave(data.length === 1 ? 0 : wave * 100)
  }

  useEffect(() => {
    if (refChartEl.current && data) {
      refChart.current?.remove()
      const l1TokenDecimals = token2Decimals(l1token)
      const chart = createChart(refChartEl.current, {
        localization: {
          locale: 'en',
          priceFormatter: (p: number) => {
            const decimalsAmount = toDecimalsGapAmount({ amount: p, l1TokenDecimals, l2TokenDecimals: decimals })
            return toExponential({
              amount: decimalsAmount,
              fixed: 4,
            })
          },
        },
        layout: {
          textColor: '#B9C1D9',
          background: {
            type: ColorType.Solid,
            color: '#2D2E36',
          },
        },
        grid: {
          vertLines: { color: '#444' },
          horzLines: { color: '#444' },
        },
        timeScale: {
          timeVisible: interval < 3600 * 24,
        },
        rightPriceScale: {
          minimumWidth: 40,
        },
      })

      let series: ISeriesApi<'Area' | 'Candlestick'> | undefined
      switch (lineStyle) {
        case LineStyle.Area:
          series = chart.addAreaSeries({
            ...DefaultLineOpts,
            topColor: 'rgba(235, 20, 132, 0.4)',
            bottomColor: 'rgba(235, 20, 132, 0.12)',
            pointMarkersVisible: data.length === 1,
            priceFormat: {
              minMove: 0.0001,
              precision: 4,
            },
          })
          break
        case LineStyle.Candles:
          series = chart.addCandlestickSeries()
        default:
      }

      // const volumeSeries = chart.addHistogramSeries({
      //   priceFormat: {
      //     type: 'volume',
      //   },
      // })
      // volumeSeries.priceScale().applyOptions({
      //   scaleMargins: {
      //     top: 0.7,
      //     bottom: 0,
      //   },
      // })
      if (lineStyle === LineStyle.Area) {
        series?.setData(
          data.map(d => ({
            time: d.time,
            value: d.value,
          })),
        )
      } else {
        series?.setData(
          data.map(d => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          })),
        )
      }
      chart.timeScale().fitContent()
      const handleCrosshairMove = (params: MouseEventParams) => {
        if (!params || params.time === undefined || !series || lineStyle !== LineStyle.Candles) return
        const price = params.seriesData.get(series) as AreaData | CandlestickData | undefined
        if (price) {
          const candlePrice = price as CandlestickData
          changePrice(candlePrice.close, candlePrice.open)
        } else {
          changePrice()
        }
      }
      refChart.current = chart
      chart.subscribeCrosshairMove(handleCrosshairMove)
      changePrice()
      return () => {
        chart.unsubscribeCrosshairMove(handleCrosshairMove)
      }
    }
  }, [data, interval])

  useEffect(() => {
    if (size) {
      refChart.current?.resize(size.width, size.height)
      refChart.current?.timeScale().fitContent()
    }
  }, [refChart, size?.width, size?.height])

  return (
    <div
      className={classNames(
        'px-[15px] py-5 bg-gray-8 border border-solid border-gray-5/30 rounded-[10px]',
        'flex flex-col',
        {
          'fixed z-10 w-screen h-screen left-0 top-0': btnValues[BtnTypes.FullScreen],
          'h-[100%]': !btnValues[BtnTypes.FullScreen],
        },
      )}>
      <ToolBar
        interval={interval}
        onIntervalChange={setChartInterval}
        lineStyle={lineStyle}
        onLineStyleChange={setLineStyle}
        expandToolbar={expandToolbar}
        btnsProps={{
          values: btnValues,
          onClick(x) {
            if (x === BtnTypes.Snapshot) {
              const canvas = refChart.current?.takeScreenshot()
              const snapshot = canvas?.toDataURL()
              if (snapshot) {
                download(snapshot, `${tokenaddress || 'Unknow'}-${dayjs().format('YYYY-MM-DD')}.png`)
              }
            } else {
              setBtnValues(s => ({
                ...s,
                [x]: !s[x],
              }))
            }
          },
        }}
      />
      {showPrice && lastPrice !== '0' ? (
        <div className="leading-[46px] text-[42px] font-[600] mt-[16px]">
          {lastPrice}
          <span
            className={classNames(
              priceWave === 0 ? 'text-gray-500' : priceWave > 0 ? 'linear-font' : 'text-green-500',
              'ml-[10px] text-[24px] font-[400]',
            )}>
            {priceWave > 0 ? '+' : ''}
            {toFixed(priceWave, 2)}%
          </span>
          {L1Price ? <p className="text-[20px] font-[400] leading-[24px]">≈ ${toEffectFixed(L1Price, 2)}</p> : ''}
        </div>
      ) : null}
      <div className="mt-3.5 relative flex-auto min-h-0 flex flex-col">
        <div className="flex-auto min-h-0" ref={refChartEl}></div>
      </div>
    </div>
  )
}

export default DetailPriceChart
