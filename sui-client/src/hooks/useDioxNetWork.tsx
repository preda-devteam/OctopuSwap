import { useEffect, useState, useCallback } from 'react'
import { useDioxContext } from './useDiox'

type NetWork = {
  id: string
  name: string
}
export default function useDioxNetWork(): NetWork | null {
  const [netWork, setNetWork] = useState<NetWork | null>(null)
  const { dioxide } = useDioxContext()

  useEffect(() => {
    if (dioxide) {
      getDioxNetWork()
      dioxide.on('network_changed', (currentNetWork: NetWork) => {
        console.log('network_changed', currentNetWork)
        setNetWork(currentNetWork)
        if (window !== undefined) {
          window.net = currentNetWork?.name
        }
        window.location.reload()
      })
      dioxide.on('connect', (e: any) => {
        console.log('connect', e)
        getDioxNetWork()
      })
      dioxide.on('disconnect', () => {
        setNetWork(null)
      })
    }
  }, [dioxide])

  const getDioxNetWork = useCallback(async () => {
    try {
      const currentNetWork = await dioxide.request({
        method: 'network',
      })
      setNetWork(currentNetWork)
      if (window !== undefined) {
        window.net = currentNetWork?.name
      }
    } catch (e) {
      console.log(e)
    }
  }, [dioxide])

  return netWork
}
