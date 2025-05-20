import Request from './request'

const request = new Request({ baseURL: '/api' })

export interface Vote {
  TokenAddress: string
  Title: string
  Description: string
  Image: string
  OutUrl: string
  Amount: string
  L1Token: string
  TotalL1Amount: string
  Ratio: number
  LimitAmount: string
  VoteStart: number
  VoteEnd: number
  Status: number
  CreateTime: number
  VoteRecommend: number
  VoteRecommendTime: number
  TotalSupply: number
  ServerTime: number
  Decimals: number
  Slogan: string
  L1TokenAmount: string
  type: 'vote'
  TotalAmount: string
  L1Price: string
}

export interface VoteActive {
  ID: number
  Address: string
  TokenAddress: string
  TokenAmount: string
  TokenDecimals: number
  Type: string
  L1Amount: string
  L1Token: string
  L1Timestamp: number
  ServerTime: number
  UserName: string
  UserIconUrl: string
  Image: string
  Title: string
  L1To: string
}

export type ActiveParams = {
  tokenaddress?: string
  address?: string
}

export default class VoteAPI {
  /**
   *
   * @param recommend  1 | undefined
   * @returns Vote[]
   */
  static getList(recommend?: number) {
    return request.get<Vote[]>('/', { params: { module: 'aitoken', action: 'list', recommend } })
  }

  static getActive(props?: ActiveParams) {
    const { tokenaddress, address } = props || {}
    return request.get<VoteActive[]>('/', { params: { module: 'activity', action: 'list', tokenaddress, address } })
  }

  static getDetail(tokenaddress: string) {
    return request.get<Vote>('/', { params: { module: 'aitoken', action: 'detail', tokenaddress } })
  }
}
