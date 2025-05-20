import { PromiseType } from 'utility-types'

export function pollingify<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  shouldStop: (x: PromiseType<ReturnType<T>>) => boolean,
  opts?: {
    pollingInterval?: number
    pollingDelayWhenErr?: number
    stopWithTimeout?: number
  },
) {
  const { pollingInterval = 500, pollingDelayWhenErr = 1000, stopWithTimeout = 10000 } = opts || {}
  const startTime = Date.now()
  const pSetTimeout = <T>(fn: () => Promise<T>, delay?: number) =>
    new Promise(resolve => {
      setTimeout(() => {
        resolve(fn())
      }, delay)
    })

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const execute: T = async function (...args) {
    try {
      const res = await fn(...args)
      const flag = shouldStop(res)
      if (stopWithTimeout && Date.now() - startTime > stopWithTimeout) {
        return Promise.reject(new Error('timeout'))
      }
      if (!flag) {
        return await pSetTimeout(() => execute(...args), pollingInterval)
      }

      return res
    } catch (e) {
      return await setTimeout(() => execute(...args), pollingDelayWhenErr)
    }
  }

  return execute
}
