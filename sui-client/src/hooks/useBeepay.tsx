import BeeAPI, { EstimateFeeProps } from '@/dataApi/Beepay'
import { bignumberMinus, bignumberMult } from '@/utils/string'
import { useRequest } from 'ahooks'

const useBeepay = (userid?: string) => {
  const { data, run: getGas } = useRequest(
    async (props: EstimateFeeProps) => {
      if (!props?.amount || !props?.chain || !props?.token) return '0'
      const res = await BeeAPI.getEstimateFee({
        totoken: 1,
        ...props,
      })
      return bignumberMinus(res.result?.total || 0, res.result?.beepayfee || 0).toString()
    },
    {
      debounceWait: 500,
    },
  )
  const toToken = (token: string) => {
    return token.toLocaleLowerCase()
  }
  const toChain = (token: string) => {
    const lowerToken = token.toLocaleLowerCase()
    switch (lowerToken) {
      case 'eth':
        return 'eth'
      case 'sol':
        return 'sol'
      default:
        return ''
    }
  }
  return {
    gas: data,
    getGas,
    toToken,
    toChain,
  }
}

export default useBeepay
