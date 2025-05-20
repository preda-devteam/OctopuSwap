import { useRequest } from 'ahooks'
import { useDioxAddressContext } from './useDioxAddress'
import UserAPI from '@/dataApi/User'

export function useFavs() {
  const { address } = useDioxAddressContext()

  return useRequest(
    async () => {
      if (!address?.address) {
        return []
      }

      const userRes = await UserAPI.getFavorite(address.address)

      return userRes?.data
    },
    {
      cacheKey: address?.address,
      cacheTime: 60 * 5 * 1000,
    },
  )
}
