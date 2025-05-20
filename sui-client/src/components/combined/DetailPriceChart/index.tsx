// 'use client'
// import React, { useEffect, useRef, useState } from 'react'
// import ReactLoading from 'react-loading'
// import * as echarts from 'echarts'
// import { useRequest } from 'ahooks'
// import classNames from 'classnames'

// enum Units {
//   DAY = '1d',
//   WEEK = '1w',
//   MONTH = '1m',
//   MONTH3 = '3m',
//   YEAR = '1yr',
// }

// const axisLabel = {
//   color: '#B9C1D9',
// }
// const lineColor = {
//   type: 'linear' as const,
//   x: 0,
//   y: 0,
//   x2: 0,
//   y2: 1,
//   colorStops: [
//     {
//       offset: 0,
//       color: '#EB1484',
//     },
//     {
//       offset: 0.27,
//       color: '#C91CC3',
//     },
//     {
//       offset: 1,
//       color: '#C81CC5',
//     },
//   ],
// }
// const areaColor = {
//   // background: linear-gradient(180deg, rgba(235, 20, 132, 0.12) 0%, rgba(245, 245, 245, 0) 100%);

//   type: 'linear' as const,
//   x: 0,
//   y: 0,
//   x2: 0,
//   y2: 1,
//   colorStops: [
//     {
//       offset: 0,
//       color: 'rgba(235, 20, 132, 0.12)',
//     },
//     {
//       offset: 1,
//       color: 'rgba(245, 245, 245, 0)',
//     },
//   ],
// }
// const lineStyle = {
//   width: 1,
//   color: '#B9C1D9',
//   opacity: 0.25,
// }

// const DetailPriceChart: React.FC<{
//   token: string
// }> = ({ token }) => {
//   const [unit, setUnit] = useState(Units.WEEK)
//   const refChart = useRef<echarts.ECharts>()
//   const refChartEl = useRef<null | HTMLDivElement>(null)
//   const { data, loading } = useRequest(
//     async () => {
//       return [
//         { name: 'Mon', value: 3000 },
//         { name: 'Que', value: 3500 },
//         { name: 'Wed', value: 4500 },
//         { name: 'Thu', value: 6000 },
//         { name: 'Fri', value: 6500 },
//         { name: 'Sat', value: 7500 },
//         { name: 'Sun', value: 8000 },
//         { name: 'Mon', value: 9000 },
//       ]
//     },
//     {
//       refreshDeps: [unit],
//       pollingInterval: 1000,
//       pollingWhenHidden: false,
//     },
//   )

//   useEffect(() => {
//     const config: echarts.EChartsOption = {
//       grid: {
//         top: 8,
//         left: 'left',
//         right: 1,
//         bottom: 0,
//         containLabel: true,
//       },
//       tooltip: {
//         trigger: 'axis',
//       },
//       xAxis: {
//         type: 'category',
//         data: data ? ['', ...data?.map(x => x.name)] : [],
//         boundaryGap: false,
//         axisLabel,
//         axisTick: {
//           show: false,
//         },
//         axisLine: {
//           lineStyle,
//         },
//         splitLine: {
//           show: true,
//           lineStyle,
//         },
//       },
//       yAxis: {
//         type: 'value',
//         axisLabel,
//         axisLine: {
//           show: true,
//           lineStyle,
//         },
//         splitLine: {
//           lineStyle,
//         },
//       },
//       series: [
//         {
//           data: data ? [data[0].value, ...data?.map(x => x.value)] : [],
//           type: 'line',
//           smooth: true,
//           symbol: 'none',
//           lineStyle: {
//             color: lineColor,
//           },
//           areaStyle: {
//             color: areaColor,
//           },
//         },
//       ],
//     }

//     if (refChartEl.current) {
//       refChart.current = echarts.init(refChartEl.current)
//       refChart.current.setOption(config)
//     }
//   }, [refChartEl.current, data])

//   return (
//     <div className="px-[15px] py-5 bg-gray-8 border border-solid border-gray-5/30 rounded-[10px]">
//       <ul className="flex items-center justify-between">
//         {Object.values(Units).map(v => {
//           return (
//             <li
//               key={v}
//               value={v}
//               className={classNames('w-10 h-[30px] rounded-[10px] flex items-center justify-center cursor-pointer', [
//                 unit === v ? 'text-gray-10 linear-bg' : 'text-gray-3',
//               ])}
//               onClick={() => setUnit(v)}>
//               {v}
//             </li>
//           )
//         })}
//       </ul>
//       <div className="mt-3.5 relative h-[230px]">
//         <div className="absolute inset-0">{loading ? <ReactLoading type="bars" /> : null}</div>
//         <div className="h-full" ref={refChartEl}></div>
//       </div>
//     </div>
//   )
// }

// export default DetailPriceChart
