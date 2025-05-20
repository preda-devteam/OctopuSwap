import Request from './request'

const request = new Request({ baseURL: '/api' })

export type ExploreItem = {
  TokenAddress: string
  Title: string
  Slogan: string
  Description: string
  Image: string
  TotalAmount: number
  MarketCap: string
  L1Token: string
  Decimals: number
  Holders: number
  Change24H: string
  Status: number
  L1Price?: string
  TVL24H?: string
}

export default class ExploreAPI {
  static getTop1() {
    return request.get<ExploreItem[]>('/', { params: { module: 'leaderboard', action: 'top1' } })
  }
  static getPopularity() {
    return request.get<ExploreItem[]>('/', { params: { module: 'leaderboard', action: 'popularity' } })
  }
  static gettop100() {
    return request.get<ExploreItem[]>('/', { params: { module: 'leaderboard', action: 'top100' } })
  }
}
