import { useEffect, useCallback, useRef } from 'react'

const useThrottle = (callback: (...arg: any[]) => any, threshold: number): ((...arg: any[]) => any) => {
  const wait = useRef(false)
  const timeout = useRef(-1)

  useEffect(() => () => clearTimeout(timeout.current), [])

  return useCallback(
    (...args: any[]) => {
      if (!wait.current) {
        callback(...args)
        wait.current = true
        clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
          wait.current = false
        }, threshold) as unknown as number
      }
    },
    [callback, threshold],
  )
}
export default useThrottle
