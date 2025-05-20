import Request, { CommonSignParams } from './request'

const request = new Request({ baseURL: '/api' })

export interface UserInfo {
  Address: string
  Name: string
  IconUrl: string
  InviteCode?: string
  originalAddress?: string
}

export interface UserFavorite {
  Address: string
  TokenAddress: string
  CreateTime: number
  Amount: string
  TotalL1Amount: string
  Image: string
  Title: string
  L1Token: string
  likeStatus?: boolean
  Status: number
}

export interface UserFavoriteParams extends CommonSignParams {
  address: string
  tokenaddress: string
  action: string
}

export interface UserVote {
  L1Token: string
  TotalL1Amount: string
}

export interface UserActiveParams extends CommonSignParams {
  tokenaddress: string
  address: string
  type: string
  l1token: string
  l1amount: string
  l1txnhash: string
  timeout?: string
  slippage?: string
  expectedamount?: string
}

export interface UserToken {
  TokenAddress: string
  Title: string
  Image: string
  Balance: string
  Decimals: 8
  Slogan: string
  Status: number
  L1Price: string
}

export default class UserAPI {
  static signupUser(address: string, invitecode?: string) {
    return request.get<UserInfo>('/', {
      params: {
        module: 'user',
        action: 'signup',
        address,
        invitecode,
      },
    })
  }
  static getUserInfo(address: string) {
    return request.get<UserInfo>('/', {
      params: {
        module: 'user',
        action: 'detail',
        address,
      },
    })
  }
  static getTokenBalance(address: string) {
    return request.get<UserToken[]>('/', {
      params: {
        module: 'user',
        action: 'balance',
        address,
      },
    })
  }
  static getFavorite(address: string) {
    return request.get<UserFavorite[]>('/', {
      params: {
        module: 'favorite',
        action: 'list',
        address,
      },
    })
  }
  static toggleFavorite({ address, tokenaddress, timestamp, signature, action }: UserFavoriteParams) {
    return request.get('/', {
      params: {
        module: 'favorite',
        action,
        address,
        tokenaddress,
        timestamp,
        signature,
      },
    })
  }
  static addActive(props: UserActiveParams) {
    return request.get('/', {
      params: {
        module: 'activity',
        action: 'add',
        ...props,
      },
    })
  }
  static getMyVote(address: string, tokenaddress: string) {
    return request.get<UserVote[]>('/', {
      params: {
        module: 'user',
        action: 'myvote',
        address,
        tokenaddress,
      },
    })
  }
}
