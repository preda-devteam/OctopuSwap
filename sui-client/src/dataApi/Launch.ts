import { Vote } from './Vote'
import Request from './request'

const request = new Request({ baseURL: '/api' })

export type Launch = Omit<Vote, 'VoteStart' | 'VoteEnd' | 'type'> & {
  LaunchStart: number
  LaunchEnd: number
  type: 'launch'
}

export interface Price {
  low: string
  high: string
  close: string
  open: string
  timestamp: number
}

export default class LaunchAPI {
  /**
   *
   * @param recommend  1 | undefined
   * @returns Vote[]
   */
  static getList(recommend?: number) {
    return request.get<Launch[]>('/', { params: { module: 'aitoken', type: 'Launch', action: 'list', recommend } })
  }

  static getDetail(tokenaddress: string) {
    return request.get<Launch>('/', { params: { module: 'aitoken', action: 'detail', tokenaddress } })
  }
}
