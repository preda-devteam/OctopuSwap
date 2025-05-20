import { DioxContextProvider } from '@/hooks/useDiox'
import { DioxAddressContextProvider } from '@/hooks/useDioxAddress'
import { cookies } from 'next/headers'

export default function xContext({ children }: { children: React.ReactElement }) {
  const cookieStore = cookies()
  const cacheAddress = cookieStore.get('cacheAddress')
  return (
    <DioxContextProvider>
      <DioxAddressContextProvider cacheAddress={cacheAddress?.value ? JSON.parse(cacheAddress.value) : null}>
        {children}
      </DioxAddressContextProvider>
    </DioxContextProvider>
  )
}
