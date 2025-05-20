import Request from './request'

const request = new Request({ baseHost: process.env.NEXT_PUBLIC_BEE_API_HOST, baseURL: '' })
const APPID = 'cd43c5776c1fbd943f1f5444927bff62'
const APIKEY = '69cf0db0b244e6f0b52db7a85c15e281aedb0d716cbd8fd8ff74d6a702004b27'

type Response = {
  result: {
    [key: string]: string
  }
}

export type EstimateFeeProps = {
  token: string
  chain: string
  amount: string
  totoken?: number
  recipient?: string
}
export default class BeeAPI {
  static getNounce() {
    return (Date.now() + Math.random() * 1000).toString()
  }
  static signup(userid: string) {
    return request.post<unknown, Response>('', {
      data: {
        jsonrpc: '2.0',
        method: 'user.signup',
        params: {
          appid: APPID,
          apikey: APIKEY,
          userid: userid.split(':')[0],
        },
        id: this.getNounce(),
      },
    })
  }
  static getDepositAddr(userid: string) {
    return request.post<unknown, Response>('', {
      data: {
        jsonrpc: '2.0',
        method: 'user.get_deposit_addr',
        params: {
          appid: APPID,
          apikey: APIKEY,
          userid: userid.split(':')[0],
        },
        id: this.getNounce(),
      },
    })
  }
  static getEstimateFee(props: EstimateFeeProps) {
    return request.post<string, Response>('', {
      data: {
        jsonrpc: '2.0',
        method: 'tx.estimate_fee',
        params: {
          appid: APPID,
          apikey: APIKEY,
          ...props,
        },
        id: 123,
      },
    })
  }
}
