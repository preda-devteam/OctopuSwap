import { cookies } from 'next/headers'

export const getAddressFromCookie = () => {
  const cookieStore = cookies()
  const cacheAddress = cookieStore.get('cacheAddress')
  const initAddr = cacheAddress?.value ? JSON.parse(cacheAddress.value).address : ''
  return initAddr
}
